/**
 * Turns design elements into one continuous stitch list.
 * Output units are 0.1 mm (PES/PEN convention), format [x, y, cmd, colourBlock].
 */

import type opentype from "opentype.js";
import { MOVE, STITCH } from "./constants";
import type { DesignElement, MonogramElement, TextElement } from "../designer/types";
import {
  type Pt,
  type Region,
  dist,
  emptyBBox,
  extendBBox,
  segmentInside,
  regionBBox,
  rotateRegion,
  translateRegion,
} from "./geometry";
import { tatamiFill } from "./fill";
import { satinBorder, satinFill } from "./satin";
import { offsetRegions, unionRegions } from "./offset";
import { DEFAULT_FABRIC, FABRIC_PROFILES, type FabricProfile, type FabricProfileId } from "./profiles";
import { beanStitch, runAroundRing } from "./running";
import { shapeRegion } from "./shapes";
import { layoutText } from "./text";

/** Gaps shorter than this are sewn through instead of jumped. */
const DIRECT_CONNECT_MM = 1.0;
/** Longer stitches are split so the thread does not float loosely. */
const MAX_STITCH_MM = 4.0;
/** Stitches shorter than this are dropped (they can break the thread). */
const MIN_STITCH_MM = 0.25;
const FILL_STITCH_MM = 3.0;
/** Travel stitches inside an area up to this length instead of jumping. */
const MAX_TRAVEL_MM = 12;
const TRAVEL_STITCH_MM = 2.5;

class StitchBuilder {
  stitches: number[][] = [];
  private pos: Pt | null = null;
  private color = 0;
  /** Number of jumps replaced by travel stitches (for tests/statistics). */
  travels = 0;

  get position(): Pt | null {
    return this.pos;
  }

  setColorBlock(index: number) {
    this.color = index;
  }

  private emit(p: Pt, cmd: number) {
    // PES/PEN units are 0.1 mm
    this.stitches.push([
      Math.round(p[0] * 10),
      Math.round(p[1] * 10),
      cmd,
      this.color,
    ]);
    this.pos = p;
  }

  private stitchTo(p: Pt) {
    if (!this.pos) {
      this.emit(p, STITCH);
      return;
    }
    const d = dist(this.pos, p);
    if (d < MIN_STITCH_MM) return;
    const n = Math.ceil(d / MAX_STITCH_MM);
    const from = this.pos;
    for (let k = 1; k <= n; k++) {
      this.emit(
        [
          from[0] + ((p[0] - from[0]) * k) / n,
          from[1] + ((p[1] - from[1]) * k) / n,
        ],
        STITCH,
      );
    }
  }

  /**
   * Sew a stroke. If `area` is given and the way from the current needle
   * position to the stroke start stays inside it, the gap is bridged with
   * short running stitches (hidden under the following stitches) instead of
   * a jump that would have to be cut.
   */
  stroke(pts: Pt[], area?: { region: Region; rule: "nonzero" | "evenodd" }) {
    if (pts.length === 0) return;
    const gap = this.pos ? dist(this.pos, pts[0]) : 0;
    if (!this.pos) {
      this.emit(pts[0], STITCH);
    } else if (
      area &&
      gap > DIRECT_CONNECT_MM &&
      gap <= MAX_TRAVEL_MM &&
      segmentInside(this.pos, pts[0], area.region, area.rule)
    ) {
      const from = this.pos;
      const n = Math.ceil(gap / TRAVEL_STITCH_MM);
      for (let k = 1; k <= n; k++)
        this.stitchTo([from[0] + ((pts[0][0] - from[0]) * k) / n, from[1] + ((pts[0][1] - from[1]) * k) / n]);
      this.travels++;
    } else if (gap > DIRECT_CONNECT_MM) {
      // Respira's encoder adds lock stitches + thread cut for jumps > 5 mm
      this.emit(pts[0], MOVE);
    } else {
      this.stitchTo(pts[0]);
    }
    for (let i = 1; i < pts.length; i++) this.stitchTo(pts[i]);
  }
}

interface Part {
  region: Region;
  color: string;
  fillRule: "nonzero" | "evenodd";
}

/** Stops that need an instruction instead of a thread change. */
export type BlockNote = "applique.place" | "applique.trim";

type SewMethod =
  | "element"
  | "border"
  | "shadow"
  | "frame"
  | "applique-place"
  | "applique-tack"
  | "applique-cover";

/** One sewing step of an element: what to sew, in which colour and how. */
interface Step {
  parts: Part[];
  color: string;
  method: SewMethod;
  /** Start a new colour block (machine stops) even if the colour stays the same. */
  stop?: BlockNote;
  /** Keep the order of the parts (SVG layers). */
  ordered?: boolean;
  /** Band width for border/frame/cover methods (mm). */
  width?: number;
}

const nz = "nonzero" as const;

function textRegions(el: { text: string; height: number; letterSpacing: number; lineSpacing: number } & Partial<TextElement>, font: opentype.Font): Region[] {
  return layoutText(font, {
    text: el.text,
    height: el.height,
    letterSpacing: el.letterSpacing,
    lineSpacing: el.lineSpacing,
    align: el.align,
    arc: el.arc,
    arcRadius: el.arcRadius,
  });
}

/** Monogram: letters side by side (middle one larger), optional satin frame. */
function monogramLayout(el: MonogramElement, font: opentype.Font): { letters: Region[]; frame: Region | null } {
  const chars = [...el.letters.replace(/\s+/g, "")].slice(0, 3);
  if (!chars.length) return { letters: [], frame: null };
  const heights = chars.map((_, i) =>
    el.style === "classic" && chars.length === 3 && i !== 1 ? el.height * 0.65 : el.height,
  );
  const glyphs = chars.map((ch, i) =>
    textRegions({ text: ch, height: heights[i], letterSpacing: 0, lineSpacing: 1 }, font),
  );
  const widths = glyphs.map((g) => {
    const bb = regionBBox(g);
    return isFinite(bb.minX) ? bb.maxX - bb.minX : 0;
  });
  const total = widths.reduce((a, w) => a + w, 0) + el.letterSpacing * (chars.length - 1);
  let x = -total / 2;
  const letters: Region[] = [];
  glyphs.forEach((g, i) => {
    const cx = x + widths[i] / 2;
    for (const r of g) letters.push(translateRegion(r, cx, 0));
    x += widths[i] + el.letterSpacing;
  });
  if (el.frame === "none") return { letters, frame: null };
  const bb = regionBBox(letters);
  const w = bb.maxX - bb.minX;
  const h = bb.maxY - bb.minY;
  const g = el.frameGap + el.frameWidth;
  let frame: Region;
  if (el.frame === "circle") {
    const d = Math.max(w, h) * 1.08 + 2 * g;
    frame = shapeRegion("circle", d, d);
  } else if (el.frame === "diamond") {
    const d = w + h + 2.8 * g;
    frame = shapeRegion("diamond", d, d);
  } else frame = shapeRegion("rect", w + 2 * g, h + 2 * g);
  return { letters, frame };
}

/** Steps of an element in its own coordinates (centred on 0,0, unrotated). */
function localSteps(el: DesignElement, fonts: Map<string, opentype.Font>): Step[] {
  const one = (region: Region, color = el.color): Part => ({ region, color, fillRule: nz });

  let base: Part[] = [];
  let ordered = false;
  if (el.kind === "text") {
    const font = fonts.get(el.fontId);
    if (!font || !el.text.trim()) return [];
    base = textRegions(el, font).map((r) => one(r));
  } else if (el.kind === "shape") {
    base = [one(shapeRegion(el.shape, el.width, el.height))];
  } else if (el.kind === "svg") {
    const scale = el.width / (el.sourceWidth || 1);
    ordered = true;
    base = el.parts.map((part) => ({
      region: part.rings.map((ring) => ring.map((p) => [p[0] * scale, p[1] * scale] as Pt)),
      color: el.singleColor ? el.color : part.color,
      fillRule: part.fillRule,
    }));
  } else {
    const font = fonts.get(el.fontId);
    if (!font) return [];
    const { letters, frame } = monogramLayout(el, font);
    const steps: Step[] = [];
    if (frame) steps.push({ parts: [one(frame, el.frameColor)], color: el.frameColor, method: "frame", width: el.frameWidth });
    if (letters.length) steps.push({ parts: letters.map((r) => one(r)), color: el.color, method: "element" });
    return steps;
  }
  if (!base.length) return [];

  // Appliqué: placement line, stop, tack-down, stop (trim), satin cover.
  if (el.mode === "applique") {
    const whole = unionRegions(base.map((p) => p.region));
    const part = [one(whole)];
    return [
      { parts: part, color: el.color, method: "applique-place" },
      { parts: part, color: el.color, method: "applique-tack", stop: "applique.place" },
      { parts: part, color: el.color, method: "applique-cover", stop: "applique.trim", width: el.borderWidth ?? 3 },
    ];
  }

  const steps: Step[] = [];
  if (el.kind === "text" && el.outlineStyle && el.outlineStyle !== "none") {
    const w = el.outlineWidth ?? 1.5;
    const color = el.outlineColor ?? "#ffffff";
    if (el.outlineStyle === "border") {
      steps.push({ parts: [one(offsetRegions(base.map((p) => p.region), w), color)], color, method: "border", width: w });
    } else {
      const shadow = base.map((p) => translateRegion(p.region, w, w));
      steps.push({ parts: [one(unionRegions(shadow), color)], color, method: "shadow" });
    }
  }
  // Parts of different colours (SVG) become separate steps, in document order.
  let cur: Step | null = null;
  for (const p of base) {
    if (!cur || cur.color !== p.color) {
      cur = { parts: [], color: p.color, method: "element", ordered };
      steps.push(cur);
    }
    cur.parts.push(p);
  }
  return steps;
}

/** Size of an element before rotation (mm), used for selection handles. */
export interface ElementBox {
  w: number;
  h: number;
}

function elementSteps(
  el: DesignElement,
  fonts: Map<string, opentype.Font>,
): { steps: Step[]; box: ElementBox } {
  const local = localSteps(el, fonts);
  const bb = emptyBBox();
  for (const st of local) for (const part of st.parts) for (const ring of part.region) for (const p of ring) extendBBox(bb, p);
  const box = isFinite(bb.minX)
    ? {
        w: Math.max(bb.maxX - bb.minX, 2 * Math.max(bb.maxX, -bb.minX)),
        h: Math.max(bb.maxY - bb.minY, 2 * Math.max(bb.maxY, -bb.minY)),
      }
    : { w: 0, h: 0 };
  const rad = ((el.rotation ?? 0) * Math.PI) / 180;
  const steps = local.map((st) => ({
    ...st,
    parts: st.parts.map((part) => ({
      ...part,
      region: translateRegion(rad ? rotateRegion(part.region, rad) : part.region, el.x, el.y),
    })),
  }));
  return { steps, box };
}

/** Outline stitch length: shorter for small letters so curves stay round. */
function outlineStitchLength(el: DesignElement): number {
  if (el.kind === "text") return Math.min(2.2, Math.max(1.0, el.height * 0.22));
  return 2.2;
}

function sewRegion(
  b: StitchBuilder,
  region: Region,
  el: DesignElement,
  fillRule: "nonzero" | "evenodd",
  fabric: FabricProfile,
) {
  const area = { region, rule: fillRule };
  const runLen = outlineStitchLength(el);
  const fillModes = ["fill", "fill-outline", "fill-satin"];

  if (fillModes.includes(el.mode)) {
    if (el.underlay) {
      if (fabric.edgeWalk)
        for (const ring of region) b.stroke(runAroundRing(ring, 2.5, b.position), area);
      for (const s of tatamiFill(
        region,
        {
          angleDeg: el.angle + (el.rotation ?? 0) + 90,
          spacing: fabric.underlaySpacing,
          stitchLength: 3.0,
          endAdjust: -0.5,
          rowInset: 0.5,
          stagger: false,
          fillRule,
        },
        b.position,
      ))
        b.stroke(s, area);
    }
    for (const s of tatamiFill(
      region,
      {
        angleDeg: el.angle + (el.rotation ?? 0),
        spacing: el.density,
        stitchLength: FILL_STITCH_MM,
        endAdjust: fabric.pullComp,
        rowInset: 0,
        stagger: true,
        fillRule,
      },
      b.position,
    ))
      b.stroke(s, area);
  }

  if (el.mode === "satin") {
    for (const s of satinFill(
      region,
      {
        spacing: el.density,
        maxWidth: 7,
        pullComp: fabric.pullComp,
        underlay: el.underlay,
        fillRule,
        fallbackSpacing: 0.4,
      },
      b.position,
    ))
      b.stroke(s, area);
  }

  if (el.mode === "fill-satin") {
    for (const s of satinBorder(
      region,
      el.borderWidth ?? 2,
      { spacing: fabric.satinSpacing, pullComp: fabric.pullComp, fillRule },
      b.position,
    ))
      b.stroke(s, area);
  }
  if (el.mode === "fill-outline") {
    for (const ring of region) b.stroke(runAroundRing(ring, runLen, b.position), area);
  }
  if (el.mode === "outline") {
    for (const ring of region) b.stroke(beanStitch(runAroundRing(ring, runLen, b.position)));
  }
}

/** Sew one step: parts nearest-first (or in order), with the step's method. */
function sewStep(b: StitchBuilder, step: Step, el: DesignElement, fabric: FabricProfile) {
  const todo = [...step.parts];
  while (todo.length) {
    let idx = 0;
    const pos = b.position;
    if (pos && !step.ordered) {
      let best = Infinity;
      todo.forEach((part, i) => {
        for (const ring of part.region)
          for (const p of ring) {
            const d = dist(p, pos);
            if (d < best) [best, idx] = [d, i];
          }
      });
    }
    const part = todo.splice(idx, 1)[0];
    const area = { region: part.region, rule: part.fillRule };
    const satinOpts = { spacing: fabric.satinSpacing, pullComp: fabric.pullComp, fillRule: part.fillRule };
    switch (step.method) {
      case "element":
        sewRegion(b, part.region, el, part.fillRule, fabric);
        break;
      case "shadow":
        sewRegion(b, part.region, { ...el, mode: "fill", angle: 45 } as DesignElement, part.fillRule, fabric);
        break;
      case "border":
      case "frame":
        // satin band along the outline, a little wider so it tucks under the letters
        for (const s of satinBorder(part.region, (step.width ?? 1.5) + (step.method === "border" ? 0.4 : 0), satinOpts, b.position))
          b.stroke(s, area);
        break;
      case "applique-place":
        for (const ring of part.region) b.stroke(runAroundRing(ring, 2.5, b.position));
        break;
      case "applique-tack": {
        const inner = offsetRegions([part.region], -0.6);
        for (const ring of inner.length ? inner : part.region) b.stroke(runAroundRing(ring, 2, b.position));
        break;
      }
      case "applique-cover": {
        const outer = offsetRegions([part.region], 0.6);
        for (const s of satinBorder(outer, (step.width ?? 3) + 0.6, satinOpts, b.position)) b.stroke(s);
        break;
      }
    }
  }
}

export interface GeneratedDesign {
  stitches: number[][];
  /** Jumps that were replaced by hidden travel stitches. */
  travels: number;
  /** Unrotated size of every element, by id. */
  boxes: Record<string, ElementBox>;
  /** One colour per colour block, in sewing order. */
  blockColors: string[];
  /** Instruction for blocks that start with a stop other than a thread change. */
  blockNotes: (BlockNote | null)[];
  /** Size of the stitched area in mm. */
  width: number;
  height: number;
}

export function generateStitches(
  elements: DesignElement[],
  fonts: Map<string, opentype.Font>,
  fabricId: FabricProfileId = DEFAULT_FABRIC,
): GeneratedDesign {
  const fabric = FABRIC_PROFILES[fabricId] ?? FABRIC_PROFILES[DEFAULT_FABRIC];
  const b = new StitchBuilder();
  const blockColors: string[] = [];
  const blockNotes: (BlockNote | null)[] = [];
  const boxes: Record<string, ElementBox> = {};
  for (const el of elements) {
    const { steps, box } = elementSteps(el, fonts);
    boxes[el.id] = box;
    for (const step of steps) {
      if (step.stop || blockColors[blockColors.length - 1] !== step.color) {
        blockColors.push(step.color);
        blockNotes.push(step.stop ?? null);
        b.setColorBlock(blockColors.length - 1);
      }
      sewStep(b, step, el, fabric);
    }
  }
  const box = emptyBBox();
  for (const s of b.stitches)
    if ((s[2] & MOVE) === 0) extendBBox(box, [s[0] / 10, s[1] / 10]);
  const empty = !isFinite(box.minX);
  return {
    stitches: b.stitches,
    boxes,
    travels: b.travels,
    blockColors,
    blockNotes,
    width: empty ? 0 : box.maxX - box.minX,
    height: empty ? 0 : box.maxY - box.minY,
  };
}

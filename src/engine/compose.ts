/**
 * Turns design elements into one continuous stitch list.
 * Output units are 0.1 mm (PES/PEN convention), format [x, y, cmd, colourBlock].
 */

import type opentype from "opentype.js";
import { MOVE, STITCH } from "./constants";
import type { DesignElement } from "../designer/types";
import {
  type Pt,
  type Region,
  dist,
  emptyBBox,
  extendBBox,
  translateRegion,
} from "./geometry";
import { tatamiFill } from "./fill";
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
const PULL_COMPENSATION_MM = 0.2;

class StitchBuilder {
  stitches: number[][] = [];
  private pos: Pt | null = null;
  private color = 0;

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

  stroke(pts: Pt[]) {
    if (pts.length === 0) return;
    if (!this.pos) {
      this.emit(pts[0], STITCH);
    } else if (dist(this.pos, pts[0]) > DIRECT_CONNECT_MM) {
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

function elementParts(
  el: DesignElement,
  fonts: Map<string, opentype.Font>,
): Part[] {
  if (el.kind === "text") {
    const font = fonts.get(el.fontId);
    if (!font || !el.text.trim()) return [];
    return layoutText(font, {
      text: el.text,
      height: el.height,
      letterSpacing: el.letterSpacing,
      lineSpacing: el.lineSpacing,
    }).map((r) => ({
      region: translateRegion(r, el.x, el.y),
      color: el.color,
      fillRule: "nonzero",
    }));
  }
  if (el.kind === "shape") {
    return [
      {
        region: translateRegion(
          shapeRegion(el.shape, el.width, el.height),
          el.x,
          el.y,
        ),
        color: el.color,
        fillRule: "nonzero",
      },
    ];
  }
  const scale = el.width / (el.sourceWidth || 1);
  return el.parts.map((part) => ({
    region: part.rings.map((ring) =>
      ring.map((p) => [p[0] * scale + el.x, p[1] * scale + el.y] as Pt),
    ),
    color: el.singleColor ? el.color : part.color,
    fillRule: part.fillRule,
  }));
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
) {
  const runLen = outlineStitchLength(el);
  const wantsFill = el.mode === "fill" || el.mode === "fill-outline";
  if (wantsFill) {
    if (el.underlay) {
      for (const s of tatamiFill(
        region,
        {
          angleDeg: el.angle + 90,
          spacing: 1.8,
          stitchLength: 3.0,
          endAdjust: -0.5,
          rowInset: 0.5,
          stagger: false,
          fillRule,
        },
        b.position,
      ))
        b.stroke(s);
    }
    for (const s of tatamiFill(
      region,
      {
        angleDeg: el.angle,
        spacing: el.density,
        stitchLength: FILL_STITCH_MM,
        endAdjust: PULL_COMPENSATION_MM,
        rowInset: 0,
        stagger: true,
        fillRule,
      },
      b.position,
    ))
      b.stroke(s);
  }
  if (el.mode === "fill-outline") {
    for (const ring of region)
      b.stroke(runAroundRing(ring, runLen, b.position));
  }
  if (el.mode === "outline") {
    for (const ring of region)
      b.stroke(beanStitch(runAroundRing(ring, runLen, b.position)));
  }
}

export interface GeneratedDesign {
  stitches: number[][];
  /** One colour per colour block, in sewing order. */
  blockColors: string[];
  /** Size of the stitched area in mm. */
  width: number;
  height: number;
}

export function generateStitches(
  elements: DesignElement[],
  fonts: Map<string, opentype.Font>,
): GeneratedDesign {
  const b = new StitchBuilder();
  const blockColors: string[] = [];
  for (const el of elements) {
    const parts = elementParts(el, fonts);
    // Text glyphs and shapes are sewn nearest-first; SVG parts keep their
    // document order because later shapes are meant to lie on top.
    const todo = [...parts];
    while (todo.length) {
      let idx = 0;
      const pos = b.position;
      if (pos && el.kind !== "svg") {
        let best = Infinity;
        todo.forEach((part, i) => {
          for (const ring of part.region)
            for (const p of ring) {
              const d = dist(p, pos);
              if (d < best) {
                best = d;
                idx = i;
              }
            }
        });
      }
      const part = todo.splice(idx, 1)[0];
      if (blockColors[blockColors.length - 1] !== part.color) {
        blockColors.push(part.color);
        b.setColorBlock(blockColors.length - 1);
      }
      sewRegion(b, part.region, el, part.fillRule);
    }
  }
  const box = emptyBBox();
  for (const s of b.stitches)
    if ((s[2] & MOVE) === 0) extendBBox(box, [s[0] / 10, s[1] / 10]);
  const empty = !isFinite(box.minX);
  return {
    stitches: b.stitches,
    blockColors,
    width: empty ? 0 : box.maxX - box.minX,
    height: empty ? 0 : box.maxY - box.minY,
  };
}

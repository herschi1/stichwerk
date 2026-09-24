/**
 * Turns text into glyph outlines (one region per glyph) in millimetres,
 * centred on (0,0).
 */

import type opentype from "opentype.js";
import {
  type Pt,
  type Region,
  type Ring,
  cleanRing,
  regionBBox,
  translateRegion,
} from "./geometry";

export interface TextLayoutOptions {
  text: string;
  /** Height of capital letters in mm. */
  height: number;
  letterSpacing: number;
  lineSpacing: number;
}

/** Curve flattening tolerance: segment count derived from control polygon length. */
function curveSteps(len: number): number {
  return Math.min(48, Math.max(3, Math.ceil(len / 0.25)));
}

function pathToRings(path: opentype.Path): Ring[] {
  const rings: Ring[] = [];
  let cur: Ring = [];
  let pen: Pt = [0, 0];
  const close = () => {
    const r = cleanRing(cur);
    if (r.length >= 3) rings.push(r);
    cur = [];
  };
  for (const c of path.commands) {
    switch (c.type) {
      case "M":
        if (cur.length) close();
        pen = [c.x, c.y];
        cur.push(pen);
        break;
      case "L":
        pen = [c.x, c.y];
        cur.push(pen);
        break;
      case "Q": {
        const p0 = pen;
        const len =
          Math.hypot(c.x1 - p0[0], c.y1 - p0[1]) +
          Math.hypot(c.x - c.x1, c.y - c.y1);
        const n = curveSteps(len);
        for (let i = 1; i <= n; i++) {
          const t = i / n;
          const mt = 1 - t;
          cur.push([
            mt * mt * p0[0] + 2 * mt * t * c.x1 + t * t * c.x,
            mt * mt * p0[1] + 2 * mt * t * c.y1 + t * t * c.y,
          ]);
        }
        pen = [c.x, c.y];
        break;
      }
      case "C": {
        const p0 = pen;
        const len =
          Math.hypot(c.x1 - p0[0], c.y1 - p0[1]) +
          Math.hypot(c.x2 - c.x1, c.y2 - c.y1) +
          Math.hypot(c.x - c.x2, c.y - c.y2);
        const n = curveSteps(len);
        for (let i = 1; i <= n; i++) {
          const t = i / n;
          const mt = 1 - t;
          cur.push([
            mt ** 3 * p0[0] +
              3 * mt * mt * t * c.x1 +
              3 * mt * t * t * c.x2 +
              t ** 3 * c.x,
            mt ** 3 * p0[1] +
              3 * mt * mt * t * c.y1 +
              3 * mt * t * t * c.y2 +
              t ** 3 * c.y,
          ]);
        }
        pen = [c.x, c.y];
        break;
      }
      case "Z":
        close();
        break;
    }
  }
  if (cur.length) close();
  return rings;
}

/** Returns one region per visible glyph, centred on (0,0). */
export function layoutText(
  font: opentype.Font,
  opts: TextLayoutOptions,
): Region[] {
  const capGlyph = font.charToGlyph("H");
  const capBox = capGlyph.getBoundingBox();
  const capUnits =
    capBox.y2 > 0
      ? capBox.y2
      : (font.tables.os2?.sCapHeight as number) || font.unitsPerEm * 0.7;
  // font size (mm per em) so that a capital H is `height` mm tall
  const fontSize = (opts.height * font.unitsPerEm) / capUnits;
  const scale = fontSize / font.unitsPerEm;
  const lineHeight = opts.height * opts.lineSpacing;

  const lines = opts.text.split(/\r?\n/);
  const glyphLines: Region[][] = [];
  const widths: number[] = [];

  lines.forEach((line, li) => {
    const glyphs = font.stringToGlyphs(line);
    const regions: Region[] = [];
    let x = 0;
    glyphs.forEach((g, i) => {
      if (g.index !== 0) {
        const rings = pathToRings(g.getPath(x, li * lineHeight, fontSize));
        if (rings.length) regions.push(rings);
      }
      x += (g.advanceWidth ?? 0) * scale;
      const next = glyphs[i + 1];
      if (next) x += font.getKerningValue(g, next) * scale + opts.letterSpacing;
    });
    glyphLines.push(regions);
    widths.push(x);
  });

  // Centre every line horizontally, then centre the whole block.
  const maxWidth = Math.max(0, ...widths);
  const all: Region[] = [];
  glyphLines.forEach((regions, i) => {
    const dx = (maxWidth - widths[i]) / 2;
    for (const r of regions) all.push(translateRegion(r, dx, 0));
  });
  if (all.length === 0) return [];
  const b = regionBBox(all);
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  return all.map((r) => translateRegion(r, -cx, -cy));
}

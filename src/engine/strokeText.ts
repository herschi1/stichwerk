/**
 * Layout for single-stroke "line fonts" (Hershey engraving fonts): returns
 * a list of open polylines (in mm, centred on 0,0) instead of filled
 * regions, so they can be sewn as a thin running/bean stitch.
 */

import type { StrokeFontData } from "../designer/strokeFonts";
import { type Pt, emptyBBox, extendBBox, translateRegion } from "./geometry";

export interface StrokeTextLayoutOptions {
  text: string;
  /** Height of capital letters in mm. */
  height: number;
  letterSpacing: number;
  lineSpacing: number;
  align?: "left" | "center" | "right";
}

/** Returns the open stroke polylines of every glyph, centred on (0,0). */
export function layoutStrokeText(font: StrokeFontData, opts: StrokeTextLayoutOptions): Pt[][] {
  const capHeight = font.capHeight || font.unitsPerEm * 0.7;
  const scale = opts.height / capHeight;
  const lineHeight = opts.height * opts.lineSpacing;
  const lines = opts.text.split(/\r?\n/);

  interface PlacedLine {
    strokes: Pt[][];
    width: number;
  }
  const placedLines: PlacedLine[] = lines.map((line) => {
    let x = 0;
    const strokes: Pt[][] = [];
    for (const ch of line) {
      const g = font.glyphs[ch] ?? font.glyphs["?"];
      if (!g) continue;
      const [adv, glyphStrokes] = g;
      for (const stroke of glyphStrokes) {
        strokes.push(stroke.map(([gx, gy]) => [x + gx * scale, gy * scale] as Pt));
      }
      x += adv * scale + opts.letterSpacing;
    }
    // remove the trailing letter-spacing so width matches the visible glyphs
    const width = Math.max(0, x - opts.letterSpacing);
    return { strokes, width };
  });

  const maxWidth = Math.max(0, ...placedLines.map((l) => l.width));
  const align = opts.align ?? "center";
  const all: Pt[][] = [];
  placedLines.forEach((l, li) => {
    const dx = align === "left" ? 0 : align === "right" ? maxWidth - l.width : (maxWidth - l.width) / 2;
    for (const s of l.strokes) all.push(s.map((p) => [p[0] + dx, p[1] + li * lineHeight] as Pt));
  });

  if (!all.length) return [];
  const b = emptyBBox();
  for (const s of all) for (const p of s) extendBBox(b, p);
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  return translateRegion(all, -cx, -cy);
}

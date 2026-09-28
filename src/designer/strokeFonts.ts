/**
 * "Line fonts" / engraving fonts: single-stroke letters sewn as a thin
 * running stitch instead of a filled or satin shape. Good for very small
 * or delicate lettering where a filled font would clump into a blob.
 *
 * Glyph data: Hershey vector fonts (public domain), distributed as modern
 * SVG fonts by the "hersheytext" npm package (MIT licence, see
 * public/fonts/stroke/LICENSE-Hershey-EMS.txt), pre-converted to compact
 * JSON at build time. All fonts cover the German umlauts (Ä Ö Ü ä ö ü ß).
 */

import type { FontCategory } from "./fonts";

export interface StrokeFontInfo {
  id: string;
  name: string;
  category: FontCategory;
  file: string;
  /** Smallest capital-letter height (mm) that still sews cleanly. */
  minHeight: number;
}

const PREFIX = "stroke:";
const s = (id: string, name: string, file: string, minHeight: number): StrokeFontInfo => ({
  id: `${PREFIX}${id}`,
  name,
  category: "stroke",
  file,
  minHeight,
});

export const STROKE_FONTS: StrokeFontInfo[] = [
  s("stroke-sans-1", "Linienschrift Sans (dünn)", "stroke-sans-1.json", 3.5),
  s("stroke-sans-med", "Linienschrift Sans (mittel)", "stroke-sans-med.json", 4),
  s("stroke-serif", "Linienschrift Serif", "stroke-serif.json", 4),
  s("stroke-readability", "Linienschrift Modern", "stroke-readability.json", 3.5),
  s("stroke-script", "Linienschrift Schreibschrift", "stroke-script.json", 5),
  s("stroke-gothic", "Linienschrift Gothic", "stroke-gothic.json", 5),
];

export function isStrokeFont(id: string): boolean {
  return id.startsWith(PREFIX);
}

export function strokeFontInfo(id: string): StrokeFontInfo {
  return STROKE_FONTS.find((f) => f.id === id) ?? STROKE_FONTS[0];
}

/** Raw glyph data as converted from the Hershey SVG fonts. */
export interface StrokeFontData {
  unitsPerEm: number;
  capHeight: number;
  ascent: number;
  descent: number;
  defaultAdv: number;
  /** char -> [advance width, list of open polylines in font units] */
  glyphs: Record<string, [number, number[][][]]>;
}

const cache = new Map<string, Promise<StrokeFontData>>();

export function loadStrokeFont(id: string): Promise<StrokeFontData> {
  const info = strokeFontInfo(id);
  const cached = cache.get(info.id);
  if (cached) return cached;
  const promise = fetch(`${import.meta.env.BASE_URL}fonts/stroke/${info.file}`).then((r) => {
    if (!r.ok) throw new Error(info.name);
    return r.json() as Promise<StrokeFontData>;
  });
  promise.catch(() => cache.delete(info.id));
  cache.set(info.id, promise);
  return promise;
}

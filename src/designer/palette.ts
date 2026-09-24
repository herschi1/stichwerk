/** Brother embroidery thread palette (data from Respira, Apache-2.0). */

import brotherColorData from "../data/BrotherColor.json";

export interface ThreadColor {
  hex: string;
  name: string;
  code: string;
}

export const BROTHER_PALETTE: ThreadColor[] = (
  brotherColorData as Array<{ R: number; G: number; B: number; ColorName: string; ColorCode: string }>
).map((c) => ({
  hex: "#" + [c.R, c.G, c.B].map((v) => v.toString(16).padStart(2, "0")).join(""),
  name: c.ColorName.charAt(0) + c.ColorName.slice(1).toLowerCase(),
  code: c.ColorCode,
}));

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/** Perceptually weighted ("redmean") distance. */
function distance(a: string, b: string): number {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  const rm = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
}

export function nearestBrotherColor(hex: string): string {
  let best = BROTHER_PALETTE[0].hex;
  let bestD = Infinity;
  for (const c of BROTHER_PALETTE) {
    const d = distance(hex, c.hex);
    if (d < bestD) {
      bestD = d;
      best = c.hex;
    }
  }
  return best;
}

export function threadInfo(hex: string): ThreadColor | undefined {
  return BROTHER_PALETTE.find((c) => c.hex === hex);
}

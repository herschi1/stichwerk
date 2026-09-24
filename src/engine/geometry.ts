/**
 * Basic geometry helpers for the stitch generator.
 * All coordinates are in millimetres, y axis points down (same as the canvas).
 */

export type Pt = [number, number];
/** A closed ring (first point is NOT repeated at the end). */
export type Ring = Pt[];
/** A fillable region: outer contours and holes, evaluated with the nonzero rule. */
export type Region = Ring[];

export interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function dist(a: Pt, b: Pt): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

export function rotatePt(p: Pt, rad: number): Pt {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
}

export function rotateRegion(region: Region, rad: number): Region {
  if (rad === 0) return region;
  return region.map((ring) => ring.map((p) => rotatePt(p, rad)));
}

export function translateRegion(
  region: Region,
  dx: number,
  dy: number,
): Region {
  return region.map((ring) => ring.map((p) => [p[0] + dx, p[1] + dy] as Pt));
}

export function emptyBBox(): BBox {
  return { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
}

export function extendBBox(b: BBox, p: Pt): void {
  if (p[0] < b.minX) b.minX = p[0];
  if (p[0] > b.maxX) b.maxX = p[0];
  if (p[1] < b.minY) b.minY = p[1];
  if (p[1] > b.maxY) b.maxY = p[1];
}

export function regionBBox(regions: Region[]): BBox {
  const b = emptyBBox();
  for (const region of regions)
    for (const ring of region) for (const p of ring) extendBBox(b, p);
  return b;
}

/** Remove consecutive duplicate points and a duplicated closing point. */
export function cleanRing(ring: Ring, eps = 1e-6): Ring {
  const out: Ring = [];
  for (const p of ring) {
    const last = out[out.length - 1];
    if (!last || dist(last, p) > eps) out.push(p);
  }
  if (out.length > 1 && dist(out[0], out[out.length - 1]) <= eps) out.pop();
  return out;
}

/** Is point p inside the region (nonzero or even-odd rule)? */
export function insideRegion(
  p: Pt,
  region: Region,
  rule: "nonzero" | "evenodd" = "nonzero",
): boolean {
  let winding = 0;
  for (const ring of region) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      if (a[1] <= p[1]) {
        if (b[1] > p[1] && (b[0] - a[0]) * (p[1] - a[1]) - (p[0] - a[0]) * (b[1] - a[1]) > 0)
          winding++;
      } else if (b[1] <= p[1] && (b[0] - a[0]) * (p[1] - a[1]) - (p[0] - a[0]) * (b[1] - a[1]) < 0)
        winding--;
    }
  }
  return rule === "evenodd" ? winding % 2 !== 0 : winding !== 0;
}

/** Does the straight line a→b stay inside the region (checked every 0.4 mm)? */
export function segmentInside(
  a: Pt,
  b: Pt,
  region: Region,
  rule: "nonzero" | "evenodd" = "nonzero",
): boolean {
  const n = Math.max(1, Math.ceil(dist(a, b) / 0.4));
  for (let k = 1; k < n; k++) {
    const t = k / n;
    if (!insideRegion([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], region, rule)) return false;
  }
  return true;
}

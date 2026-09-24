/**
 * Running stitch along outlines.
 */

import { type Pt, type Ring, dist } from "./geometry";

/**
 * Walk around a closed ring with stitches of about `len` mm, keeping corners.
 * Starts at the ring point closest to `from` and ends back at the start.
 */
export function runAroundRing(ring: Ring, len: number, from: Pt | null): Pt[] {
  if (ring.length < 2) return [];
  let startIdx = 0;
  if (from) {
    let best = Infinity;
    ring.forEach((p, i) => {
      const d = dist(p, from);
      if (d < best) {
        best = d;
        startIdx = i;
      }
    });
  }
  const ordered = [...ring.slice(startIdx), ...ring.slice(0, startIdx)];
  ordered.push(ordered[0]);

  // Merge very short edges (flattened curves) so stitches are not tiny.
  const out: Pt[] = [ordered[0]];
  let acc = 0;
  for (let i = 1; i < ordered.length; i++) {
    const a = ordered[i - 1];
    const b = ordered[i];
    const d = dist(a, b);
    const isCorner = (() => {
      const c = ordered[i + 1];
      if (!c) return true;
      const v1 = [b[0] - a[0], b[1] - a[1]];
      const v2 = [c[0] - b[0], c[1] - b[1]];
      const l1 = Math.hypot(v1[0], v1[1]);
      const l2 = Math.hypot(v2[0], v2[1]);
      if (l1 === 0 || l2 === 0) return false;
      const cos = (v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2);
      return cos < 0.7; // sharper than ~45°
    })();
    acc += d;
    if (acc >= len * 0.999 || isCorner || i === ordered.length - 1) {
      // Split the accumulated part evenly if it got longer than len.
      const last = out[out.length - 1];
      const straight = dist(last, b);
      const n = Math.max(1, Math.round(straight / len));
      for (let k = 1; k <= n; k++) {
        out.push([
          last[0] + ((b[0] - last[0]) * k) / n,
          last[1] + ((b[1] - last[1]) * k) / n,
        ]);
      }
      acc = 0;
    }
  }
  return out;
}

/** Bean stitch: every stitch is sewn forward, back and forward again. */
export function beanStitch(pts: Pt[]): Pt[] {
  if (pts.length < 2) return pts;
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    out.push(pts[i], pts[i - 1], pts[i]);
  }
  return out;
}

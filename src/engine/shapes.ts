/**
 * Outline generators for basic shapes, centred on (0,0), size in mm.
 */

import type { ShapeKind } from "../designer/types";
import type { Pt, Region } from "./geometry";

function normalize(pts: Pt[], width: number, height: number): Pt[] {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of pts) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const sx = width / (maxX - minX || 1);
  const sy = height / (maxY - minY || 1);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return pts.map(([x, y]) => [(x - cx) * sx, (y - cy) * sy]);
}

export function shapeRegion(
  shape: ShapeKind,
  width: number,
  height: number,
): Region {
  const pts: Pt[] = [];
  switch (shape) {
    case "circle": {
      const n = 120;
      for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 2;
        pts.push([Math.cos(t), Math.sin(t)]);
      }
      break;
    }
    case "rect":
      pts.push([-1, -1], [1, -1], [1, 1], [-1, 1]);
      break;
    case "heart": {
      const n = 160;
      for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 2;
        const x = 16 * Math.sin(t) ** 3;
        const y =
          13 * Math.cos(t) -
          5 * Math.cos(2 * t) -
          2 * Math.cos(3 * t) -
          Math.cos(4 * t);
        pts.push([x, -y]); // y axis points down
      }
      break;
    }
    case "diamond":
      pts.push([0, -1], [1, 0], [0, 1], [-1, 0]);
      break;
    case "star": {
      const spikes = 5;
      const inner = 0.45;
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? 1 : inner;
        const t = -Math.PI / 2 + (i * Math.PI) / spikes;
        pts.push([Math.cos(t) * r, Math.sin(t) * r]);
      }
      break;
    }
  }
  return [normalize(pts, width, height)];
}

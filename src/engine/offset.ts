/**
 * Polygon offsetting and union (Clipper by Angus Johnson, Boost licence).
 * Used for text outlines, appliqué borders and monogram frames.
 */

import ClipperLib from "clipper-lib";
import type { Pt, Region } from "./geometry";

/** Clipper works with integers: 1 unit = 1/1000 mm. */
const SCALE = 1000;

type Path = { X: number; Y: number }[];

const toPaths = (region: Region): Path[] =>
  region.map((ring) => ring.map(([x, y]) => ({ X: Math.round(x * SCALE), Y: Math.round(y * SCALE) })));

const fromPaths = (paths: Path[]): Region =>
  paths.filter((p) => p.length >= 3).map((p) => p.map((q) => [q.X / SCALE, q.Y / SCALE] as Pt));

/**
 * Grow (positive) or shrink (negative) a set of regions by `delta` mm with
 * round corners; overlapping results are merged into one region.
 */
export function offsetRegions(
  regions: Region[],
  delta: number,
  rule: "nonzero" | "evenodd" = "nonzero",
): Region {
  const co = new ClipperLib.ClipperOffset(2, 0.02 * SCALE);
  // first merge all input regions so holes and overlaps are handled correctly
  const merged = unionRegions(regions, rule);
  co.AddPaths(toPaths(merged), ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
  const out: Path[] = [];
  co.Execute(out, delta * SCALE);
  return fromPaths(out);
}

export function unionRegions(regions: Region[], rule: "nonzero" | "evenodd" = "nonzero"): Region {
  const c = new ClipperLib.Clipper();
  for (const r of regions) c.AddPaths(toPaths(r), ClipperLib.PolyType.ptSubject, true);
  const out: Path[] = [];
  const ft = rule === "evenodd" ? ClipperLib.PolyFillType.pftEvenOdd : ClipperLib.PolyFillType.pftNonZero;
  c.Execute(ClipperLib.ClipType.ctUnion, out, ft, ft);
  return fromPaths(out);
}

/** Outline of an open polyline with the given width (for satin/fill lines). */
export function strokePolyline(points: Pt[], width: number, closed = false): Region {
  const co = new ClipperLib.ClipperOffset(2, 0.02 * SCALE);
  co.AddPath(
    points.map(([x, y]) => ({ X: Math.round(x * SCALE), Y: Math.round(y * SCALE) })),
    ClipperLib.JoinType.jtRound,
    closed ? ClipperLib.EndType.etClosedLine : ClipperLib.EndType.etOpenRound,
  );
  const out: Path[] = [];
  co.Execute(out, (width / 2) * SCALE);
  return fromPaths(out);
}

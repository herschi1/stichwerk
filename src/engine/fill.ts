/**
 * Tatami fill: covers a region with parallel rows of running stitches.
 *
 * 1. The region is rotated so the rows become horizontal.
 * 2. Every row is intersected with the outline (nonzero winding rule, so
 *    overlapping font contours work).
 * 3. Row segments are chained into "blocks" – areas that can be stitched
 *    in one go by going back and forth (boustrophedon).
 * 4. Blocks are ordered nearest-neighbour to keep jumps short.
 */

import { type Pt, type Region, dist, rotatePt, rotateRegion } from "./geometry";

export interface FillOptions {
  /** Row direction in degrees (0 = horizontal rows). */
  angleDeg: number;
  /** Distance between rows in mm (density). */
  spacing: number;
  /** Maximum stitch length within a row in mm. */
  stitchLength: number;
  /** Positive: extend rows at both ends (pull compensation). Negative: inset. */
  endAdjust: number;
  /** Keep this distance from the top/bottom edge of the region (mm). */
  rowInset: number;
  /** Offset the needle points from row to row (classic tatami look). */
  stagger: boolean;
  /** Which areas count as "inside" (SVG fill-rule). Default nonzero. */
  fillRule?: "nonzero" | "evenodd";
}

export interface Seg {
  x0: number;
  x1: number;
  y: number;
  row: number;
}

/** A stroke is a list of points stitched one after another without a jump. */
export type Stroke = Pt[];

export function scanRows(
  region: Region,
  opts: Pick<FillOptions, "spacing" | "rowInset" | "endAdjust" | "fillRule">,
): Seg[][] {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const ring of region)
    for (const p of ring) {
      minY = Math.min(minY, p[1]);
      maxY = Math.max(maxY, p[1]);
    }
  if (!isFinite(minY)) return [];

  const rows: Seg[][] = [];
  const first = minY + Math.max(opts.spacing / 2, opts.rowInset);
  const last = maxY - opts.rowInset;
  let rowIndex = 0;
  for (let y = first; y <= last + 1e-9; y += opts.spacing, rowIndex++) {
    const crossings: Array<{ x: number; dir: number }> = [];
    for (const ring of region) {
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i];
        const b = ring[(i + 1) % ring.length];
        if (a[1] === b[1]) continue;
        const lo = Math.min(a[1], b[1]);
        const hi = Math.max(a[1], b[1]);
        if (y < lo || y >= hi) continue;
        const x = a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]);
        crossings.push({ x, dir: b[1] > a[1] ? 1 : -1 });
      }
    }
    crossings.sort((p, q) => p.x - q.x);

    const segs: Seg[] = [];
    const inside = (w: number) =>
      opts.fillRule === "evenodd" ? w % 2 !== 0 : w !== 0;
    let winding = 0;
    let start = 0;
    for (const c of crossings) {
      const wasIn = inside(winding);
      winding += c.dir;
      const isIn = inside(winding);
      if (!wasIn && isIn) start = c.x;
      if (wasIn && !isIn) {
        const x0 = start - opts.endAdjust;
        const x1 = c.x + opts.endAdjust;
        if (x1 - x0 >= 0.3) segs.push({ x0, x1, y, row: rowIndex });
      }
    }
    rows.push(segs);
  }
  return rows;
}

/** Chain row segments into blocks that can be stitched back and forth. */
export function buildBlocks(rows: Seg[][]): Seg[][] {
  const done: Seg[][] = [];
  let open: Seg[][] = [];
  for (const segs of rows) {
    const overlaps = (a: Seg, b: Seg) => a.x0 < b.x1 && a.x1 > b.x0;
    const next: Seg[][] = [];
    const used = new Set<Seg>();
    for (const block of open) {
      const lastSeg = block[block.length - 1];
      const cands = segs.filter((s) => overlaps(s, lastSeg));
      if (cands.length === 1) {
        const s = cands[0];
        const parents = open.filter((b) => overlaps(s, b[b.length - 1]));
        if (parents.length === 1 && !used.has(s)) {
          block.push(s);
          used.add(s);
          next.push(block);
          continue;
        }
      }
      done.push(block);
    }
    for (const s of segs) if (!used.has(s)) next.push([s]);
    open = next;
  }
  return done.concat(open);
}

function rowPoints(seg: Seg, leftToRight: boolean, opts: FillOptions): Pt[] {
  const L = opts.stitchLength;
  const offset = opts.stagger ? ((seg.row % 3) / 3) * L : 0;
  const margin = Math.min(0.6, L * 0.3);
  const xs: number[] = [];
  let k = Math.ceil((seg.x0 + margin - offset) / L);
  for (let x = k * L + offset; x < seg.x1 - margin; k++, x = k * L + offset)
    xs.push(x);
  const pts: Pt[] = [[seg.x0, seg.y]];
  for (const x of xs) pts.push([x, seg.y]);
  pts.push([seg.x1, seg.y]);
  return leftToRight ? pts : pts.reverse();
}

function stitchBlock(
  block: Seg[],
  fromTop: boolean,
  startLeft: boolean,
  opts: FillOptions,
): Pt[] {
  const rows = fromTop ? block : [...block].reverse();
  const out: Pt[] = [];
  rows.forEach((seg, i) => {
    const ltr = i % 2 === 0 ? startLeft : !startLeft;
    out.push(...rowPoints(seg, ltr, opts));
  });
  return out;
}

/**
 * Fill a region. Returns strokes in design coordinates; `from` is the current
 * needle position used to pick a good starting point.
 */
export function tatamiFill(
  region: Region,
  opts: FillOptions,
  from: Pt | null,
): Stroke[] {
  const rad = (opts.angleDeg * Math.PI) / 180;
  const rotated = rotateRegion(region, -rad);
  const blocks = buildBlocks(scanRows(rotated, opts));

  let cur: Pt | null = from ? rotatePt(from, -rad) : null;
  const remaining = blocks.filter((b) => b.length > 0);
  const strokes: Stroke[] = [];

  while (remaining.length > 0) {
    let best = { idx: 0, fromTop: true, startLeft: true, d: Infinity };
    remaining.forEach((block, idx) => {
      for (const fromTop of [true, false]) {
        const firstSeg = fromTop ? block[0] : block[block.length - 1];
        for (const startLeft of [true, false]) {
          const entry: Pt = [startLeft ? firstSeg.x0 : firstSeg.x1, firstSeg.y];
          const d = cur ? dist(cur, entry) : idx === 0 && fromTop ? 0 : 1;
          if (d < best.d) best = { idx, fromTop, startLeft, d };
        }
      }
    });
    const [block] = remaining.splice(best.idx, 1);
    const pts = stitchBlock(block, best.fromTop, best.startLeft, opts);
    cur = pts[pts.length - 1];
    strokes.push(pts.map((p) => rotatePt(p, rad)));
  }
  return strokes;
}

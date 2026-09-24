/**
 * Satin stitch.
 *
 * satinFill: the region is cut into rows like a fill, but every row becomes a
 * single stitch from edge to edge (zigzag), which gives the smooth, glossy
 * satin look. The row direction is chosen per glyph so rows stay short; parts
 * that would still need too long stitches are re-cut at 90° and, if that does
 * not help either, filled with tatami.
 *
 * satinBorder: a zigzag band of fixed width along every outline.
 */

import { type Pt, type Region, dist, insideRegion, rotatePt, rotateRegion } from "./geometry";
import { type Seg, type Stroke, buildBlocks, scanRows, tatamiFill } from "./fill";

export interface SatinOptions {
  /** Distance between zigzag stitches in mm. */
  spacing: number;
  /** Stitches longer than this are not sewn as satin (mm). */
  maxWidth: number;
  /** Pull compensation added at both ends of every stitch (mm). */
  pullComp: number;
  underlay: boolean;
  fillRule: "nonzero" | "evenodd";
  /** Tatami settings for parts that are too wide for satin. */
  fallbackSpacing: number;
}

interface Run {
  rows: Seg[];
  /** Rotation used for these rows (radians). */
  rad: number;
}

/** Split blocks into runs of rows that are narrow enough, collect the rest as polygons. */
function cut(region: Region, rad: number, opts: SatinOptions) {
  const rows = scanRows(rotateRegion(region, -rad), {
    spacing: opts.spacing,
    rowInset: 0,
    endAdjust: opts.pullComp,
    fillRule: opts.fillRule,
  });
  const short: Run[] = [];
  const wide: Region[] = [];
  let shortLen = 0;
  let totalLen = 0;
  let shortRows = 0;
  for (const block of buildBlocks(rows)) {
    let cur: Seg[] = [];
    let curShort: boolean | null = null;
    const flush = () => {
      if (!cur.length) return;
      if (curShort) short.push({ rows: cur, rad });
      else {
        // rebuild the polygon of this slice (without pull compensation)
        const left = cur.map((s) => [s.x0 + opts.pullComp, s.y] as Pt);
        const right = cur.map((s) => [s.x1 - opts.pullComp, s.y] as Pt).reverse();
        const half = opts.spacing / 2;
        left[0] = [left[0][0], left[0][1] - half];
        right[right.length - 1] = [right[right.length - 1][0], right[right.length - 1][1] - half];
        left[left.length - 1] = [left[left.length - 1][0], left[left.length - 1][1] + half];
        right[0] = [right[0][0], right[0][1] + half];
        wide.push([[...left, ...right].map((p) => rotatePt(p, rad))]);
      }
      cur = [];
    };
    for (const seg of block) {
      const len = seg.x1 - seg.x0;
      totalLen += len;
      const isShort = len <= opts.maxWidth;
      if (isShort) {
        shortLen += len;
        shortRows++;
      }
      if (curShort !== null && isShort !== curShort) flush();
      curShort = isShort;
      cur.push(seg);
    }
    flush();
  }
  // Prefer: most area as satin, then few separate columns, then short
  // stitches (= stitches running across the stroke, the classic satin look).
  const avgShort = shortRows ? shortLen / shortRows : 0;
  const score = totalLen ? shortLen / totalLen - short.length * 0.002 - avgShort * 0.02 : 0;
  return { short, wide, score };
}

function runEnds(run: Run): [Pt, Pt] {
  const first = run.rows[0];
  const last = run.rows[run.rows.length - 1];
  const mid = (s: Seg): Pt => rotatePt([(s.x0 + s.x1) / 2, s.y], run.rad);
  return [mid(first), mid(last)];
}

function sewRun(run: Run, fromStart: boolean, opts: SatinOptions): Pt[] {
  const rows = fromStart ? run.rows : [...run.rows].reverse();
  const pts: Pt[] = [];
  const width = rows.reduce((m, s) => Math.max(m, s.x1 - s.x0), 0);
  const length = rows.length * opts.spacing;
  // Centre walk out, satin back: the underlay ends where the satin begins.
  if (opts.underlay && width > 1.2 && length > 1.5) {
    const step = Math.max(1, Math.round(2 / opts.spacing));
    const walk: Pt[] = [];
    for (let i = 0; i < rows.length; i += step) walk.push([(rows[i].x0 + rows[i].x1) / 2, rows[i].y]);
    const last = rows[rows.length - 1];
    walk.push([(last.x0 + last.x1) / 2, last.y]);
    pts.push(...walk);
    rows.reverse();
  }
  rows.forEach((s, i) => {
    if (i % 2 === 0) pts.push([s.x0, s.y], [s.x1, s.y]);
    else pts.push([s.x1, s.y], [s.x0, s.y]);
  });
  return pts.map((p) => rotatePt(p, run.rad));
}

export function satinFill(region: Region, opts: SatinOptions, from: Pt | null): Stroke[] {
  // Pick the row direction that keeps most rows narrow.
  let best = cut(region, 0, opts);
  for (const deg of [30, 45, 60, 90, 120, 135, 150]) {
    const c = cut(region, (deg * Math.PI) / 180, opts);
    if (c.score > best.score + 1e-6) best = c;
  }
  const runs = [...best.short];
  const fallback: Region[] = [];
  const rad90 = (best.short[0]?.rad ?? 0) + Math.PI / 2;
  for (const w of best.wide) {
    const c = cut(w, rad90, { ...opts, fillRule: "nonzero" });
    runs.push(...c.short);
    fallback.push(...c.wide);
  }

  const strokes: Stroke[] = [];
  let cur = from;
  // Fallback fills first, so the satin lies on top.
  for (const w of fallback) {
    const s = tatamiFill(
      w,
      {
        angleDeg: 45,
        spacing: opts.fallbackSpacing,
        stitchLength: 3,
        endAdjust: opts.pullComp,
        rowInset: 0,
        stagger: true,
      },
      cur,
    );
    strokes.push(...s);
    if (s.length) cur = s[s.length - 1][s[s.length - 1].length - 1];
  }
  const todo = [...runs];
  while (todo.length) {
    let bi = 0;
    let bStart = true;
    let bd = Infinity;
    todo.forEach((r, i) => {
      const [a, b] = runEnds(r);
      const da = cur ? dist(cur, a) : 0;
      const db = cur ? dist(cur, b) : 1;
      if (da < bd) [bd, bi, bStart] = [da, i, true];
      if (db < bd) [bd, bi, bStart] = [db, i, false];
    });
    const pts = sewRun(todo.splice(bi, 1)[0], bStart, opts);
    strokes.push(pts);
    cur = pts[pts.length - 1];
  }
  return strokes;
}

/** Zigzag band of `width` mm along every outline of the region, on the inside. */
export function satinBorder(
  region: Region,
  width: number,
  opts: Pick<SatinOptions, "spacing" | "pullComp" | "fillRule">,
  from: Pt | null,
): Stroke[] {
  const strokes: Stroke[] = [];
  let cur = from;
  for (const ring of region) {
    if (ring.length < 3) continue;
    // resample the ring evenly
    const closed = [...ring, ring[0]];
    const samples: Pt[] = [];
    let carry = 0;
    for (let i = 1; i < closed.length; i++) {
      const a = closed[i - 1];
      const b = closed[i];
      const d = dist(a, b);
      let t = carry;
      while (t < d) {
        samples.push([a[0] + ((b[0] - a[0]) * t) / d, a[1] + ((b[1] - a[1]) * t) / d]);
        t += opts.spacing;
      }
      carry = t - d;
    }
    if (samples.length < 4) continue;
    // smoothed normals: tangent from points ~1 mm before and after
    const k = Math.max(1, Math.round(1 / opts.spacing));
    const n = samples.length;
    const outerPts: Pt[] = [];
    const innerPts: Pt[] = [];
    let flip: number | null = null;
    for (let i = 0; i < n; i++) {
      const p = samples[i];
      const a = samples[(i - k + n) % n];
      const b = samples[(i + k) % n];
      const tx = b[0] - a[0];
      const ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      let nx = -ty / tl;
      let ny = tx / tl;
      if (flip === null) {
        flip = insideRegion([p[0] + nx * 0.3, p[1] + ny * 0.3], region, opts.fillRule) ? 1 : -1;
      }
      nx *= flip;
      ny *= flip;
      outerPts.push([p[0] - nx * opts.pullComp, p[1] - ny * opts.pullComp]);
      innerPts.push([p[0] + nx * width, p[1] + ny * width]);
    }
    // start at the sample nearest to the needle
    let start = 0;
    if (cur) {
      let bd = Infinity;
      samples.forEach((p, i) => {
        const d = dist(p, cur!);
        if (d < bd) [bd, start] = [d, i];
      });
    }
    const pts: Pt[] = [];
    // running underlay along the middle of the band, then the zigzag
    for (let j = 0; j <= n; j += Math.max(1, Math.round(2 / opts.spacing))) {
      const i = (start + j) % n;
      const p = samples[i];
      const q = innerPts[i];
      pts.push([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]);
    }
    for (let j = 0; j <= n; j++) {
      const i = (start + j) % n;
      pts.push(j % 2 === 0 ? outerPts[i] : innerPts[i]);
    }
    strokes.push(pts);
    cur = pts[pts.length - 1];
  }
  return strokes;
}

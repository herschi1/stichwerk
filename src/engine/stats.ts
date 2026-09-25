/**
 * Statistics about a stitch list: stitches, jumps, cuts and a thread estimate.
 * Stitch units are 0.1 mm, format [x, y, cmd, colourBlock].
 */

import { MOVE } from "./constants";

/** Jumps longer than this get a thread cut from the PEN encoder (0.1 mm units). */
const CUT_JUMP = 50;
/** Extra top thread per stitch for the loop around the bobbin thread (mm). */
const LOOP_MM = 1.0;
/** Top thread lies a little longer than the stitch path because of tension. */
const TENSION = 1.15;
/** Bobbin thread in relation to top thread for normal tension. */
const BOBBIN_RATIO = 0.4;

export interface BlockStats {
  color: string;
  stitches: number;
  /** Index of the first and last stitch of this block in the stitch list. */
  start: number;
  end: number;
  /** Estimated top thread in metres. */
  threadM: number;
}

export interface DesignStats {
  blocks: BlockStats[];
  jumps: number;
  cuts: number;
  topThreadM: number;
  bobbinThreadM: number;
}

export function designStats(stitches: number[][], blockColors: string[]): DesignStats {
  const blocks: BlockStats[] = [];
  let jumps = 0;
  let cuts = 0;
  let pathMm = 0;
  let count = 0;
  let cur: BlockStats | null = null;

  const close = () => {
    if (cur) {
      cur.threadM = (pathMm * TENSION + count * LOOP_MM) / 1000;
      blocks.push(cur);
    }
  };

  stitches.forEach((s, i) => {
    if (!cur || s[3] !== stitches[i - 1][3]) {
      close();
      cur = { color: blockColors[s[3]] ?? "#000000", stitches: 0, start: i, end: i, threadM: 0 };
      pathMm = 0;
      count = 0;
    }
    cur.end = i;
    const prev = stitches[i - 1];
    if (s[2] & MOVE) {
      jumps++;
      if (prev && Math.hypot(s[0] - prev[0], s[1] - prev[1]) > CUT_JUMP) cuts++;
      return;
    }
    cur.stitches++;
    count++;
    if (prev && prev[3] === s[3] && !(prev[2] & MOVE)) pathMm += Math.hypot(s[0] - prev[0], s[1] - prev[1]) / 10;
  });
  close();

  const topThreadM = blocks.reduce((a, b) => a + b.threadM, 0);
  return { blocks, jumps, cuts, topThreadM, bobbinThreadM: topThreadM * BOBBIN_RATIO };
}

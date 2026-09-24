/**
 * PES writer (truncated PES v1 + PEC block).
 * Ported from pyembroidery / pystitch (MIT licence, © Tatarize).
 *
 * Input stitches use 0.1 mm units: [x, y, cmd, colourBlock].
 */

import { MOVE } from "../engine/constants";
import { PEC_ICON_BLANK, PEC_THREADS } from "./pecData";

const CMD_STITCH = 0;
const CMD_JUMP = 1;
const CMD_COLOR_CHANGE = 2;
const CMD_END = 3;

const JUMP_CODE = 0b00010000;
const TRIM_CODE = 0b00100000;
const ICON_W = 48;
const ICON_H = 38;
const ICON_STRIDE = ICON_W / 8;

class ByteWriter {
  private buf: number[] = [];
  get pos() {
    return this.buf.length;
  }
  bytes(values: ArrayLike<number>) {
    for (let i = 0; i < values.length; i++) this.buf.push(values[i] & 0xff);
  }
  ascii(s: string) {
    for (let i = 0; i < s.length; i++) this.buf.push(s.charCodeAt(i) & 0xff);
  }
  u8(v: number) {
    this.buf.push(v & 0xff);
  }
  u16(v: number) {
    this.buf.push(v & 0xff, (v >> 8) & 0xff);
  }
  u24(v: number) {
    this.buf.push(v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff);
  }
  u24At(at: number, v: number) {
    this.buf[at] = v & 0xff;
    this.buf[at + 1] = (v >> 8) & 0xff;
    this.buf[at + 2] = (v >> 16) & 0xff;
  }
  result(): Uint8Array<ArrayBuffer> {
    return new Uint8Array(this.buf);
  }
}

type Cmd = [number, number, number];

function toCommands(stitches: number[][]): Cmd[] {
  const out: Cmd[] = [];
  // Start with a jump to the first needle position (like pyembroidery does)
  if (stitches.length) out.push([stitches[0][0], stitches[0][1], CMD_JUMP]);
  for (let i = 0; i < stitches.length; i++) {
    const [x, y, cmd, block] = stitches[i];
    const prev = stitches[i - 1];
    if (prev && prev[3] !== block) out.push([prev[0], prev[1], CMD_COLOR_CHANGE]);
    out.push([x, y, cmd & MOVE ? CMD_JUMP : CMD_STITCH]);
  }
  const last = out[out.length - 1];
  out.push([last ? last[0] : 0, last ? last[1] : 0, CMD_END]);
  return out;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function colorDistance(a: [number, number, number], b: [number, number, number]) {
  const redMean = Math.round((a[0] + b[0]) / 2);
  const r = a[0] - b[0];
  const g = a[1] - b[1];
  const bl = a[2] - b[2];
  return (((512 + redMean) * r * r) >> 8) + 4 * g * g + (((767 - redMean) * bl * bl) >> 8);
}

function nearestIndex(color: string, palette: (string | null)[]): number | null {
  const rgb = hexToRgb(color);
  let best: number | null = null;
  let bestDist = Infinity;
  palette.forEach((c, i) => {
    if (!c) return;
    const d = colorDistance(rgb, hexToRgb(c));
    if (d <= bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}

/** Same algorithm as pyembroidery's build_unique_palette. */
function pecColorIndices(blockColors: string[]): number[] {
  const palette: (string | null)[] = [...PEC_THREADS];
  const chart: (string | null)[] = new Array(palette.length).fill(null);
  for (const color of new Set(blockColors)) {
    const idx = nearestIndex(color, palette);
    if (idx === null) break;
    palette[idx] = null;
    chart[idx] = color;
  }
  return blockColors.map((c) => nearestIndex(c, chart) ?? 0);
}

function writeValue(w: ByteWriter, value: number, long = false, flag = 0) {
  if (!long && value > -64 && value < 63) {
    w.u8(value & 0x7f);
  } else {
    let v = value & 0x0fff;
    v |= 0x8000;
    v |= flag << 8;
    w.u8((v >> 8) & 0xff);
    w.u8(v & 0xff);
  }
}

function drawScaled(
  bounds: [number, number, number, number],
  points: Cmd[],
  graphic: number[],
  buffer: number,
) {
  const [left, top, right, bottom] = bounds;
  const dw = right - left || 1;
  const dh = bottom - top || 1;
  const gh = graphic.length / ICON_STRIDE;
  const scale = Math.min((ICON_W - buffer) / dw, (gh - buffer) / dh);
  const tx = -((right + left) / 2) * scale + ICON_W / 2;
  const ty = -((bottom + top) / 2) * scale + gh / 2;
  for (const p of points) {
    const x = Math.floor(p[0] * scale + tx);
    const y = Math.floor(p[1] * scale + ty);
    const idx = y * ICON_STRIDE + Math.floor(x / 8);
    if (x >= 0 && idx >= 0 && idx < graphic.length) graphic[idx] |= 1 << (x % 8);
  }
}

export function writePes(
  stitches: number[][],
  blockColors: string[],
  name = "Stichwerk",
): Uint8Array<ArrayBuffer> {
  const cmds = toCommands(stitches);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of cmds) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  if (!isFinite(minX)) minX = minY = maxX = maxY = 0;
  const bounds: [number, number, number, number] = [minX, minY, maxX, maxY];

  const w = new ByteWriter();
  // Truncated PES v1 header: signature + offset of the PEC block (0x16)
  w.ascii("#PES0001");
  w.bytes([0x16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  // ---- PEC header ----
  const label = (name.replace(/[^A-Za-z0-9]+/g, "") || "Untitled").slice(0, 8);
  w.ascii(`LA:${label.padEnd(16, " ")}\r`);
  w.bytes([0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0xff, 0x00]);
  w.u8(ICON_STRIDE);
  w.u8(ICON_H);
  const indices = pecColorIndices(blockColors);
  if (indices.length > 0) {
    w.bytes(new Array(12).fill(0x20));
    w.u8(indices.length - 1);
    w.bytes(indices);
  } else {
    w.bytes([0x20, 0x20, 0x20, 0x20, 0x64, 0x20, 0x00, 0x20, 0x00, 0x20, 0x20, 0x20, 0xff]);
  }
  for (let i = indices.length; i < 463; i++) w.u8(0x20);

  // ---- PEC stitch block ----
  const blockStart = w.pos;
  w.bytes([0x00, 0x00]);
  w.u24(0); // length placeholder
  w.bytes([0x31, 0xff, 0xf0]);
  w.u16(Math.round(maxX - minX));
  w.u16(Math.round(maxY - minY));
  w.u16(0x1e0);
  w.u16(0x1b0);
  writeValue(w, -Math.round(minX), true, JUMP_CODE);
  writeValue(w, -Math.round(minY), true, JUMP_CODE);

  let colorTwo = true;
  let jumping = true;
  let init = true;
  let xx = 0;
  let yy = 0;
  for (const [x, y, cmd] of cmds) {
    const dx = Math.round(x - xx);
    const dy = Math.round(y - yy);
    xx += dx;
    yy += dy;
    if (cmd === CMD_STITCH) {
      if (jumping) {
        if (dx !== 0 && dy !== 0) {
          writeValue(w, 0);
          writeValue(w, 0);
        }
        jumping = false;
      }
      writeValue(w, dx);
      writeValue(w, dy);
    } else if (cmd === CMD_JUMP) {
      jumping = true;
      const flag = init ? JUMP_CODE : TRIM_CODE;
      writeValue(w, dx, true, flag);
      writeValue(w, dy, true, flag);
    } else if (cmd === CMD_COLOR_CHANGE) {
      if (jumping) {
        writeValue(w, 0);
        writeValue(w, 0);
        jumping = false;
      }
      w.bytes([0xfe, 0xb0, colorTwo ? 0x02 : 0x01]);
      colorTwo = !colorTwo;
    } else if (cmd === CMD_END) {
      w.u8(0xff);
      break;
    }
    init = false;
  }
  w.u24At(blockStart + 2, w.pos - blockStart);

  // ---- PEC graphics: overview icon + one icon per colour block ----
  const overview = [...PEC_ICON_BLANK];
  drawScaled(bounds, cmds, overview, 4);
  w.bytes(overview);
  let blockPts: Cmd[] = [];
  const flush = () => {
    const icon = [...PEC_ICON_BLANK];
    drawScaled(bounds, blockPts, icon, 5);
    w.bytes(icon);
    blockPts = [];
  };
  for (const c of cmds) {
    if (c[2] === CMD_COLOR_CHANGE || c[2] === CMD_END) flush();
    else if (c[2] === CMD_STITCH) blockPts.push(c);
  }
  return w.result();
}

/**
 * Selection handling on the preview canvas: hit testing, handles and the
 * maths for moving, scaling and rotating elements. Pure functions, no React.
 */

import type { DesignElement } from "../designer/types";
import type { ElementBox } from "../engine/compose";

export interface View {
  /** px per mm */
  scale: number;
  /** screen position of the hoop centre (px) */
  ox: number;
  oy: number;
}

export type Pt = [number, number];

export const toMm = (v: View, sx: number, sy: number): Pt => [(sx - v.ox) / v.scale, (sy - v.oy) / v.scale];
export const toPx = (v: View, p: Pt): Pt => [v.ox + p[0] * v.scale, v.oy + p[1] * v.scale];

const rad = (deg: number) => (deg * Math.PI) / 180;

function rotate(p: Pt, a: number): Pt {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
}

/** Point in the element's own (unrotated, centred) coordinates. */
export function toLocal(el: DesignElement, p: Pt): Pt {
  return rotate([p[0] - el.x, p[1] - el.y], -rad(el.rotation ?? 0));
}

export function fromLocal(el: DesignElement, p: Pt): Pt {
  const q = rotate(p, rad(el.rotation ?? 0));
  return [q[0] + el.x, q[1] + el.y];
}

/** Distance of the rotate handle above the box, in px. */
const ROTATE_OFFSET_PX = 26;
const HANDLE_PX = 9;

export function corners(box: ElementBox): Pt[] {
  const w = box.w / 2;
  const h = box.h / 2;
  return [
    [-w, -h],
    [w, -h],
    [w, h],
    [-w, h],
  ];
}

export type Handle = "rotate" | "scale";

/** Which handle of the selected element is under the pointer (px distance). */
export function hitHandle(v: View, el: DesignElement, box: ElementBox, p: Pt): Handle | null {
  const near = (q: Pt, px: number) => Math.hypot((q[0] - p[0]) * v.scale, (q[1] - p[1]) * v.scale) <= px;
  const rotateAt = fromLocal(el, [0, -box.h / 2 - ROTATE_OFFSET_PX / v.scale]);
  if (near(rotateAt, HANDLE_PX + 3)) return "rotate";
  for (const c of corners(box)) if (near(fromLocal(el, c), HANDLE_PX)) return "scale";
  return null;
}

/** Topmost element under the pointer (later elements lie on top). */
export function hitElement(
  v: View,
  elements: DesignElement[],
  boxes: Record<string, ElementBox>,
  p: Pt,
): DesignElement | null {
  const tol = 4 / v.scale;
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    const box = boxes[el.id];
    if (!box) continue;
    const [lx, ly] = toLocal(el, p);
    if (Math.abs(lx) <= box.w / 2 + tol && Math.abs(ly) <= box.h / 2 + tol) return el;
  }
  return null;
}

// ---- drag maths ----

export interface DragStart {
  el: DesignElement;
  box: ElementBox;
  p: Pt;
}

export interface Guides {
  x: boolean;
  y: boolean;
}

const round1 = (v: number) => Math.round(v * 10) / 10;

/** Move; snaps the element centre to the hoop centre lines. */
export function dragMove(v: View, d: DragStart, p: Pt, free: boolean): { patch: Partial<DesignElement>; guides: Guides } {
  let x = d.el.x + (p[0] - d.p[0]);
  let y = d.el.y + (p[1] - d.p[1]);
  const snap = 7 / v.scale;
  const guides = { x: false, y: false };
  if (!free && Math.abs(x) < snap) [x, guides.x] = [0, true];
  if (!free && Math.abs(y) < snap) [y, guides.y] = [0, true];
  return { patch: { x: round1(x), y: round1(y) }, guides };
}

/** Uniform scaling from the element centre by dragging a corner. */
export function dragScale(d: DragStart, p: Pt): Partial<DesignElement> {
  const c: Pt = [d.el.x, d.el.y];
  const f0 = Math.hypot(d.p[0] - c[0], d.p[1] - c[1]) || 1;
  const f = Math.max(0.05, Math.hypot(p[0] - c[0], p[1] - c[1]) / f0);
  const clamp = (v: number, lo: number, hi: number) => round1(Math.min(hi, Math.max(lo, v)));
  const el = d.el;
  if (el.kind === "text") return { height: clamp(el.height * f, 3, 90) };
  if (el.kind === "shape") {
    const g = Math.min(f, 100 / el.width, 100 / el.height);
    return { width: clamp(el.width * g, 3, 100), height: clamp(el.height * g, 3, 100) };
  }
  return { width: clamp(el.width * f, 5, 100) };
}

/** Rotation around the centre; Shift snaps to 15°, otherwise soft snap to 0/90/180/270. */
export function dragRotate(d: DragStart, p: Pt, step15: boolean): Partial<DesignElement> {
  const c: Pt = [d.el.x, d.el.y];
  const a0 = Math.atan2(d.p[1] - c[1], d.p[0] - c[0]);
  const a1 = Math.atan2(p[1] - c[1], p[0] - c[0]);
  let deg = (d.el.rotation ?? 0) + ((a1 - a0) * 180) / Math.PI;
  deg = ((((deg + 180) % 360) + 360) % 360) - 180;
  if (step15) deg = Math.round(deg / 15) * 15;
  else {
    const nearest = Math.round(deg / 90) * 90;
    if (Math.abs(deg - nearest) < 3) deg = nearest;
  }
  if (deg === -180) deg = 180;
  return { rotation: Math.round(deg) };
}

// ---- drawing ----

export function drawSelection(
  ctx: CanvasRenderingContext2D,
  v: View,
  el: DesignElement,
  box: ElementBox,
  guides: Guides,
  hoop: { w: number; h: number },
) {
  const px = corners(box).map((c) => toPx(v, fromLocal(el, c)));
  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#c98a12";
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  px.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  // rotate handle with its stem
  const topMid = toPx(v, fromLocal(el, [0, -box.h / 2]));
  const rot = toPx(v, fromLocal(el, [0, -box.h / 2 - ROTATE_OFFSET_PX / v.scale]));
  ctx.beginPath();
  ctx.moveTo(topMid[0], topMid[1]);
  ctx.lineTo(rot[0], rot[1]);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(rot[0], rot[1], 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // scale handles
  for (const q of px) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(q[0] - 4.5, q[1] - 4.5, 9, 9);
    ctx.strokeRect(q[0] - 4.5, q[1] - 4.5, 9, 9);
  }

  // centre guides while snapping
  ctx.strokeStyle = "rgba(201,138,18,0.9)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  if (guides.x) {
    const a = toPx(v, [0, -hoop.h / 2]);
    const b = toPx(v, [0, hoop.h / 2]);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }
  if (guides.y) {
    const a = toPx(v, [-hoop.w / 2, 0]);
    const b = toPx(v, [hoop.w / 2, 0]);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * SVG import: turns the filled shapes of an SVG file into rings that the
 * stitch engine can fill. Supported: path, rect, circle, ellipse, polygon,
 * polyline, groups, transforms, fill / fill-rule (attribute, style, inherited).
 * Stroke-only artwork is ignored for now.
 */

import type { Pt } from "../engine/geometry";
import type { SvgPart } from "../designer/types";

type Matrix = [number, number, number, number, number, number];
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

function multiply(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

function apply(m: Matrix, p: Pt): Pt {
  return [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
}

function nums(s: string): number[] {
  return (s.match(/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? []).map(Number);
}

export function parseTransform(attr: string | null): Matrix {
  let m: Matrix = IDENTITY;
  if (!attr) return m;
  const re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(attr))) {
    const v = nums(match[2]);
    let t: Matrix = IDENTITY;
    switch (match[1]) {
      case "matrix":
        if (v.length === 6) t = v as Matrix;
        break;
      case "translate":
        t = [1, 0, 0, 1, v[0] ?? 0, v[1] ?? 0];
        break;
      case "scale":
        t = [v[0] ?? 1, 0, 0, v[1] ?? v[0] ?? 1, 0, 0];
        break;
      case "rotate": {
        const a = ((v[0] ?? 0) * Math.PI) / 180;
        const c = Math.cos(a);
        const s = Math.sin(a);
        const cx = v[1] ?? 0;
        const cy = v[2] ?? 0;
        t = [c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy];
        break;
      }
      case "skewX":
        t = [1, 0, Math.tan(((v[0] ?? 0) * Math.PI) / 180), 1, 0, 0];
        break;
      case "skewY":
        t = [1, Math.tan(((v[0] ?? 0) * Math.PI) / 180), 0, 1, 0, 0];
        break;
    }
    m = multiply(m, t);
  }
  return m;
}

/** Number of line segments for a curve, based on its rough length. */
function steps(len: number, tol: number): number {
  return Math.min(64, Math.max(4, Math.ceil(len / tol)));
}

function arcPoints(
  p0: Pt,
  rxIn: number,
  ryIn: number,
  phiDeg: number,
  largeArc: boolean,
  sweep: boolean,
  p1: Pt,
  tol: number,
): Pt[] {
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (rx === 0 || ry === 0) return [p1];
  const phi = (phiDeg * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (p0[0] - p1[0]) / 2;
  const dy = (p0[1] - p1[1]) / 2;
  const x1 = cos * dx + sin * dy;
  const y1 = -sin * dx + cos * dy;
  const lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  let co = Math.sqrt(Math.max(0, num / den));
  if (largeArc === sweep) co = -co;
  const cxp = (co * rx * y1) / ry;
  const cyp = (-co * ry * x1) / rx;
  const cx = cos * cxp - sin * cyp + (p0[0] + p1[0]) / 2;
  const cy = sin * cxp + cos * cyp + (p0[1] + p1[1]) / 2;
  const angle = (ux: number, uy: number, vx: number, vy: number) =>
    Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const t1 = angle(1, 0, (x1 - cxp) / rx, (y1 - cyp) / ry);
  let dt = angle((x1 - cxp) / rx, (y1 - cyp) / ry, (-x1 - cxp) / rx, (-y1 - cyp) / ry);
  if (!sweep && dt > 0) dt -= 2 * Math.PI;
  if (sweep && dt < 0) dt += 2 * Math.PI;
  const n = steps(Math.abs(dt) * Math.max(rx, ry), tol);
  const pts: Pt[] = [];
  for (let i = 1; i <= n; i++) {
    const t = t1 + (dt * i) / n;
    const x = rx * Math.cos(t);
    const y = ry * Math.sin(t);
    pts.push([cos * x - sin * y + cx, sin * x + cos * y + cy]);
  }
  return pts;
}

/** Flatten SVG path data into polylines (one per subpath). */
export function parsePathData(d: string, tol = 0.25): Pt[][] {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? [];
  const rings: Pt[][] = [];
  let ring: Pt[] = [];
  let cur: Pt = [0, 0];
  let start: Pt = [0, 0];
  let lastCtrl: Pt | null = null;
  let lastCmd = "";
  let i = 0;
  let cmd = "";
  const num = () => parseFloat(tokens[i++]);
  const flag = () => {
    // arc flags may be written without separators, e.g. "a1 1 0 01.5 1"
    // flags are always a single 0/1 digit, the rest belongs to the next number
    const t = tokens[i];
    if (t.length > 1 && (t[0] === "0" || t[0] === "1")) {
      tokens[i] = t.slice(1);
      return t[0] === "1";
    }
    i++;
    return parseFloat(t) !== 0;
  };
  const endRing = () => {
    if (ring.length >= 3) rings.push(ring);
    ring = [];
  };
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    else if (!cmd) break;
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const ox = rel ? cur[0] : 0;
    const oy = rel ? cur[1] : 0;
    switch (C) {
      case "M": {
        endRing();
        cur = [num() + ox, num() + oy];
        start = cur;
        ring.push(cur);
        cmd = rel ? "l" : "L"; // following pairs are line-tos
        lastCtrl = null;
        break;
      }
      case "L":
        cur = [num() + ox, num() + oy];
        ring.push(cur);
        lastCtrl = null;
        break;
      case "H":
        cur = [num() + ox, cur[1]];
        ring.push(cur);
        lastCtrl = null;
        break;
      case "V":
        cur = [cur[0], num() + oy];
        ring.push(cur);
        lastCtrl = null;
        break;
      case "C":
      case "S": {
        let c1: Pt;
        if (C === "C") c1 = [num() + ox, num() + oy];
        else
          c1 =
            lastCtrl && /[CS]/i.test(lastCmd)
              ? [2 * cur[0] - lastCtrl[0], 2 * cur[1] - lastCtrl[1]]
              : cur;
        const c2: Pt = [num() + ox, num() + oy];
        const p: Pt = [num() + ox, num() + oy];
        const len =
          Math.hypot(c1[0] - cur[0], c1[1] - cur[1]) +
          Math.hypot(c2[0] - c1[0], c2[1] - c1[1]) +
          Math.hypot(p[0] - c2[0], p[1] - c2[1]);
        const n = steps(len, tol);
        for (let k = 1; k <= n; k++) {
          const t = k / n;
          const mt = 1 - t;
          ring.push([
            mt ** 3 * cur[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t ** 3 * p[0],
            mt ** 3 * cur[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t ** 3 * p[1],
          ]);
        }
        lastCtrl = c2;
        cur = p;
        break;
      }
      case "Q":
      case "T": {
        let c: Pt;
        if (C === "Q") c = [num() + ox, num() + oy];
        else
          c =
            lastCtrl && /[QT]/i.test(lastCmd)
              ? [2 * cur[0] - lastCtrl[0], 2 * cur[1] - lastCtrl[1]]
              : cur;
        const p: Pt = [num() + ox, num() + oy];
        const len = Math.hypot(c[0] - cur[0], c[1] - cur[1]) + Math.hypot(p[0] - c[0], p[1] - c[1]);
        const n = steps(len, tol);
        for (let k = 1; k <= n; k++) {
          const t = k / n;
          const mt = 1 - t;
          ring.push([
            mt * mt * cur[0] + 2 * mt * t * c[0] + t * t * p[0],
            mt * mt * cur[1] + 2 * mt * t * c[1] + t * t * p[1],
          ]);
        }
        lastCtrl = c;
        cur = p;
        break;
      }
      case "A": {
        const rx = num();
        const ry = num();
        const rot = num();
        const large = flag();
        const sw = flag();
        const p: Pt = [num() + ox, num() + oy];
        ring.push(...arcPoints(cur, rx, ry, rot, large, sw, p, tol));
        cur = p;
        lastCtrl = null;
        break;
      }
      case "Z":
        cur = start;
        endRing();
        lastCtrl = null;
        break;
      default:
        i++; // unknown token, skip
    }
    lastCmd = C;
  }
  endRing();
  return rings;
}

function ellipsePoints(cx: number, cy: number, rx: number, ry: number): Pt[] {
  const n = 96;
  const pts: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const t = (k / n) * Math.PI * 2;
    pts.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
  }
  return pts;
}

const NAMED_COLORS: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
  yellow: "#ffff00",
  orange: "#ffa500",
  purple: "#800080",
  pink: "#ffc0cb",
  gray: "#808080",
  grey: "#808080",
  brown: "#a52a2a",
  navy: "#000080",
  gold: "#ffd700",
};

function normalizeColor(c: string): string | null {
  const s = c.trim().toLowerCase();
  if (!s || s === "none" || s === "transparent") return null;
  if (s.startsWith("#")) {
    if (s.length === 4) return "#" + [...s.slice(1)].map((h) => h + h).join("");
    return s.slice(0, 7);
  }
  const rgb = s.match(/rgba?\(([^)]*)\)/);
  if (rgb) {
    const v = rgb[1].split(",").map((x) =>
      x.includes("%") ? Math.round(parseFloat(x) * 2.55) : Math.round(parseFloat(x)),
    );
    return "#" + v.slice(0, 3).map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0")).join("");
  }
  return NAMED_COLORS[s] ?? "#000000";
}

function styleValue(el: Element, prop: string): string | null {
  const style = el.getAttribute("style");
  if (style) {
    const m = style.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`));
    if (m) return m[1].trim();
  }
  return el.getAttribute(prop);
}

export interface ImportedSvg {
  parts: SvgPart[];
  width: number;
  height: number;
}

/** Parse an SVG document. Needs a DOM (browser). */
export function importSvg(text: string): ImportedSvg {
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== "svg")
    throw new Error("svg-invalid");

  const parts: SvgPart[] = [];
  const walk = (
    node: Element,
    m: Matrix,
    fill: string | null,
    rule: "nonzero" | "evenodd",
  ) => {
    const tag = node.nodeName.toLowerCase().replace(/^svg:/, "");
    if (["defs", "clippath", "mask", "style", "title", "desc", "metadata", "symbol"].includes(tag))
      return;
    if (styleValue(node, "display") === "none") return;
    const fAttr = styleValue(node, "fill");
    const myFill = fAttr === null || fAttr === "inherit" ? fill : normalizeColor(fAttr);
    const rAttr = styleValue(node, "fill-rule");
    const myRule = rAttr === "evenodd" ? "evenodd" : rAttr === "nonzero" ? "nonzero" : rule;
    const myM = multiply(m, parseTransform(node.getAttribute("transform")));
    const num = (a: string) => parseFloat(node.getAttribute(a) ?? "0") || 0;

    let rings: Pt[][] = [];
    switch (tag) {
      case "path":
        rings = parsePathData(node.getAttribute("d") ?? "");
        break;
      case "rect": {
        const x = num("x");
        const y = num("y");
        const w = num("width");
        const h = num("height");
        if (w > 0 && h > 0)
          rings = [
            [
              [x, y],
              [x + w, y],
              [x + w, y + h],
              [x, y + h],
            ],
          ];
        break;
      }
      case "circle":
        rings = [ellipsePoints(num("cx"), num("cy"), num("r"), num("r"))];
        break;
      case "ellipse":
        rings = [ellipsePoints(num("cx"), num("cy"), num("rx"), num("ry"))];
        break;
      case "polygon":
      case "polyline": {
        const v = nums(node.getAttribute("points") ?? "");
        const ring: Pt[] = [];
        for (let k = 0; k + 1 < v.length; k += 2) ring.push([v[k], v[k + 1]]);
        if (ring.length >= 3) rings = [ring];
        break;
      }
    }
    if (rings.length && myFill) {
      parts.push({
        color: myFill,
        fillRule: myRule,
        rings: rings.map((r) => r.map((p) => apply(myM, p))),
      });
    }
    for (const child of Array.from(node.children)) walk(child, myM, myFill, myRule);
  };

  // viewBox offset is irrelevant (we centre afterwards), only the scale matters.
  walk(root, IDENTITY, "#000000", "nonzero");
  if (parts.length === 0) throw new Error("svg-empty");

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const part of parts)
    for (const r of part.rings)
      for (const p of r) {
        minX = Math.min(minX, p[0]);
        minY = Math.min(minY, p[1]);
        maxX = Math.max(maxX, p[0]);
        maxY = Math.max(maxY, p[1]);
      }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const round = (v: number) => Math.round(v * 1000) / 1000;
  return {
    parts: parts.map((p) => ({
      ...p,
      rings: p.rings.map((r) => r.map(([x, y]) => [round(x - cx), round(y - cy)] as Pt)),
    })),
    width: maxX - minX,
    height: maxY - minY,
  };
}

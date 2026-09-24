import { describe, expect, it } from "vitest";
import { satinBorder, satinFill } from "./satin";
import { generateStitches } from "./compose";
import { MOVE } from "./constants";
import type { Region } from "./geometry";
import type { ShapeElement } from "../designer/types";

const bar: Region = [
  [
    [-20, -1.5],
    [20, -1.5],
    [20, 1.5],
    [-20, 1.5],
  ],
];
const opts = {
  spacing: 0.3,
  maxWidth: 7,
  pullComp: 0.2,
  underlay: false,
  fillRule: "nonzero" as const,
  fallbackSpacing: 0.4,
};

describe("satin", () => {
  it("sews a narrow bar with stitches straight across it", () => {
    const strokes = satinFill(bar, opts, null);
    const pts = strokes.flat();
    // stitches go across the 3 mm height (vertical), not along the 40 mm length
    let across = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = Math.abs(pts[i][0] - pts[i - 1][0]);
      const dy = Math.abs(pts[i][1] - pts[i - 1][1]);
      if (dy > 3) across++;
      expect(dx).toBeLessThan(1);
    }
    expect(across).toBeGreaterThan(100);
  });

  it("uses tatami for areas too wide for satin", () => {
    const big: Region = [
      [
        [-15, -15],
        [15, -15],
        [15, 15],
        [-15, 15],
      ],
    ];
    for (const pts of satinFill(big, opts, null))
      for (let i = 1; i < pts.length; i++) {
        const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        expect(d).toBeLessThanOrEqual(8);
      }
  });

  it("keeps the satin border inside the shape plus pull compensation", () => {
    const pts = satinBorder(bar, 1, { spacing: 0.3, pullComp: 0.2, fillRule: "nonzero" }, null).flat();
    for (const [x, y] of pts) {
      expect(Math.abs(x)).toBeLessThanOrEqual(20.25);
      expect(Math.abs(y)).toBeLessThanOrEqual(1.75);
    }
  });
});

describe("fabric profiles and travel stitches", () => {
  const ring: ShapeElement = {
    id: "r",
    kind: "shape",
    shape: "star",
    width: 40,
    height: 38,
    x: 0,
    y: 0,
    color: "#000000",
    mode: "fill",
    angle: 0,
    density: 0.4,
    underlay: true,
  };

  it("replaces jumps inside an area with travel stitches", () => {
    const d = generateStitches([ring], new Map(), "woven");
    expect(d.travels).toBeGreaterThan(0);
    // every non-jump stitch stays within the star (plus pull compensation)
    for (const [x, y, cmd] of d.stitches) {
      if (cmd & MOVE) continue;
      expect(Math.abs(x)).toBeLessThanOrEqual(205);
      expect(Math.abs(y)).toBeLessThanOrEqual(195);
    }
  });

  it("gives jersey more pull compensation than canvas", () => {
    const w = (id: "jersey" | "canvas") => generateStitches([ring], new Map(), id).width;
    expect(w("jersey")).toBeGreaterThan(w("canvas"));
  });
});

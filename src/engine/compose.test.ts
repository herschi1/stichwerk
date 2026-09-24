import { describe, expect, it } from "vitest";
import { generateStitches } from "./compose";
import { MOVE } from "./constants";
import type { ShapeElement, SvgElement } from "../designer/types";

const heart: ShapeElement = {
  id: "h",
  kind: "shape",
  shape: "heart",
  width: 30,
  height: 27,
  x: 5,
  y: -10,
  color: "#ed171f",
  mode: "fill-outline",
  angle: 45,
  density: 0.4,
  underlay: true,
};

describe("stitch generation", () => {
  it("fills a shape within its bounds", () => {
    const d = generateStitches([heart], new Map());
    expect(d.stitches.length).toBeGreaterThan(300);
    for (const [x, y] of d.stitches) {
      expect(x).toBeGreaterThanOrEqual(-105);
      expect(x).toBeLessThanOrEqual(205);
      expect(y).toBeGreaterThanOrEqual(-240);
      expect(y).toBeLessThanOrEqual(40);
    }
    expect(d.width).toBeCloseTo(30, 0);
  });

  it("creates one colour block per colour change", () => {
    const blue = { ...heart, id: "b", color: "#0a55a3", x: -5 };
    expect(generateStitches([heart, blue, heart], new Map()).blockColors).toEqual([
      "#ed171f",
      "#0a55a3",
      "#ed171f",
    ]);
  });

  it("never produces stitches longer than 4 mm", () => {
    const { stitches } = generateStitches([heart], new Map());
    for (let i = 1; i < stitches.length; i++) {
      if (stitches[i][2] & MOVE) continue;
      const d = Math.hypot(stitches[i][0] - stitches[i - 1][0], stitches[i][1] - stitches[i - 1][1]);
      expect(d).toBeLessThanOrEqual(40.5);
    }
  });

  it("honours even-odd holes in SVG parts", () => {
    const square = (s: number): [number, number][] => [
      [-s, -s],
      [s, -s],
      [s, s],
      [-s, s],
    ];
    const svg: SvgElement = {
      ...heart,
      kind: "svg",
      name: "ring",
      parts: [{ color: "#000000", fillRule: "evenodd", rings: [square(10), square(5)] }],
      sourceWidth: 20,
      sourceHeight: 20,
      width: 20,
      singleColor: false,
      x: 0,
      y: 0,
      mode: "fill",
    };
    const { stitches } = generateStitches([svg], new Map());
    const inHole = stitches.filter(([x, y, c]) => !(c & MOVE) && Math.abs(x) < 40 && Math.abs(y) < 40);
    expect(inHole.length).toBe(0);
  });
});

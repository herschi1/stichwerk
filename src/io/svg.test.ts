import { describe, expect, it } from "vitest";
import { parsePathData, parseTransform } from "./svg";

describe("svg path parser", () => {
  it("parses absolute and relative lines", () => {
    const [ring] = parsePathData("M10 10 h20 v20 H10 z");
    expect(ring).toEqual([
      [10, 10],
      [30, 10],
      [30, 30],
      [10, 30],
    ]);
  });

  it("handles implicit line-tos and multiple subpaths", () => {
    const rings = parsePathData("M0,0 10,0 10,10z m20,0 l5,0 0,5 z");
    expect(rings.length).toBe(2);
    expect(rings[1][0]).toEqual([20, 0]);
    expect(rings[1][2]).toEqual([25, 5]);
  });

  it("flattens curves and compact arc flags", () => {
    const [ring] = parsePathData("M0 0 C 0 10 10 10 10 0 a5 5 0 01-10 0z");
    const last = ring[ring.length - 1];
    expect(last[0]).toBeCloseTo(0, 5);
    expect(last[1]).toBeCloseTo(0, 5);
    expect(ring.length).toBeGreaterThan(8);
  });

  it("parses transforms", () => {
    const m = parseTransform("translate(10 5) scale(2)");
    expect(m).toEqual([2, 0, 0, 2, 10, 5]);
  });
});

import { describe, expect, it } from "vitest";
import { offsetRegions, unionRegions } from "./offset";
import { regionBBox } from "./geometry";

const sq = (x: number, s: number) => [[[x, 0], [x + s, 0], [x + s, s], [x, s]]] as [number, number][][];

describe("offset", () => {
  it("grows a square by the given distance", () => {
    const b = regionBBox([offsetRegions([sq(0, 10)], 2)]);
    expect(b.minX).toBeCloseTo(-2, 1);
    expect(b.maxX).toBeCloseTo(12, 1);
  });
  it("merges overlapping shapes", () => {
    expect(unionRegions([sq(0, 10), sq(5, 10)]).length).toBe(1);
    expect(unionRegions([sq(0, 10), sq(20, 10)]).length).toBe(2);
  });
});

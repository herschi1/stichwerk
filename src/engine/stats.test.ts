import { describe, expect, it } from "vitest";
import { designStats } from "./stats";

describe("design statistics", () => {
  it("counts blocks, jumps, cuts and estimates thread", () => {
    const st = [
      [0, 0, 0, 0],
      [30, 0, 0, 0], // 3 mm
      [30, 30, 0, 0], // 3 mm
      [60, 30, 0x10, 0], // short jump, no cut
      [60, 30, 0, 0],
      [200, 30, 0x10, 1], // long jump into the next colour -> cut
      [230, 30, 0, 1],
    ];
    const s = designStats(st, ["#000000", "#ff0000"]);
    expect(s.blocks.map((b) => b.stitches)).toEqual([4, 1]);
    expect(s.jumps).toBe(2);
    expect(s.cuts).toBe(1);
    // block 0: path 6 mm * 1.15 + 4 loops * 1 mm = 10.9 mm
    expect(s.blocks[0].threadM).toBeCloseTo(0.0109, 4);
    expect(s.blocks[1].start).toBe(5);
  });
});

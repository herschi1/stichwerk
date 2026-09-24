import { describe, expect, it } from "vitest";
import { writePes } from "./pes";

describe("PES writer", () => {
  it("writes a PES v1 header with the PEC block right after it", () => {
    const pes = writePes(
      [
        [0, 0, 0, 0],
        [30, 0, 0, 0],
        [30, 30, 0, 1],
      ],
      ["#000000", "#ed171f"],
    );
    const sig = String.fromCharCode(...pes.slice(0, 8));
    expect(sig).toBe("#PES0001");
    expect(pes[8]).toBe(0x16);
    expect(String.fromCharCode(...pes.slice(0x16, 0x16 + 3))).toBe("LA:");
    // two colours -> count byte 1 at offset 0x16 + 48
    expect(pes[0x16 + 48]).toBe(1);
  });
});

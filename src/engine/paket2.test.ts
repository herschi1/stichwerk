import { describe, expect, it } from "vitest";
import { generateStitches } from "./compose";
import type { ShapeElement } from "../designer/types";

const heart: ShapeElement = {
  id: "h", kind: "shape", shape: "heart", width: 30, height: 27, x: 0, y: 0,
  color: "#c0392b", mode: "applique", angle: 45, density: 0.4, underlay: true, borderWidth: 3,
};

describe("appliqué", () => {
  it("creates three blocks with stops for placing and trimming", () => {
    const d = generateStitches([heart], new Map());
    expect(d.blockColors).toEqual(["#c0392b", "#c0392b", "#c0392b"]);
    expect(d.blockNotes).toEqual([null, "applique.place", "applique.trim"]);
    const blocks = new Set(d.stitches.map((s) => s[3]));
    expect(blocks.size).toBe(3);
  });
});

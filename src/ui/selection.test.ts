import { describe, expect, it } from "vitest";
import { dragMove, dragRotate, dragScale, hitElement, hitHandle, type View } from "./selection";
import type { ShapeElement } from "../designer/types";

const v: View = { scale: 5, ox: 300, oy: 300 };
const el: ShapeElement = {
  id: "a", kind: "shape", shape: "rect", width: 20, height: 10, x: 10, y: 0,
  color: "#000000", mode: "fill", angle: 0, density: 0.4, underlay: true, rotation: 90,
};
const box = { w: 20, h: 10 };

describe("selection maths", () => {
  it("hits a rotated element in its own frame", () => {
    // rotated by 90°: now 10 wide, 20 tall
    expect(hitElement(v, [el], { a: box }, [10, 9])?.id).toBe("a");
    expect(hitElement(v, [el], { a: box }, [18, 0])).toBeNull();
  });

  it("finds the rotate handle beside the rotated box", () => {
    // top of the box points to +x after rotating 90° clockwise
    expect(hitHandle(v, el, box, [10 + 5 + 26 / 5, 0])).toBe("rotate");
  });

  it("snaps to the hoop centre while moving", () => {
    const { patch, guides } = dragMove(v, { el, box, p: [10, 0] }, [0.5, 3], false);
    expect(patch.x).toBe(0);
    expect(guides.x).toBe(true);
    expect(dragMove(v, { el, box, p: [10, 0] }, [0.5, 3], true).patch.x).toBe(0.5);
  });

  it("scales uniformly and rotates in 15° steps", () => {
    expect(dragScale({ el, box, p: [20, 0] }, [30, 0])).toEqual({ width: 40, height: 20 });
    expect(dragRotate({ el: { ...el, rotation: 0 }, box, p: [20, 0] }, [10, 12], true)).toEqual({ rotation: 90 });
  });
});

import { describe, expect, it } from "vitest";
import { layoutStrokeText } from "./strokeText";
import { generateStitches } from "./compose";
import type { StrokeFontData } from "../designer/strokeFonts";
import type { TextElement } from "../designer/types";
import { STITCH } from "./constants";

/** A tiny fake font: "A" is a single diagonal stroke, "B" is two strokes. */
const FAKE_FONT: StrokeFontData = {
  unitsPerEm: 1000,
  capHeight: 500,
  ascent: 800,
  descent: -200,
  defaultAdv: 400,
  glyphs: {
    A: [400, [[[0, 500], [400, 0]]]],
    B: [
      400,
      [
        [[0, 500], [0, 0]],
        [[0, 250], [300, 250]],
      ],
    ],
  },
};

describe("layoutStrokeText", () => {
  it("scales glyphs to the requested cap height and centres the result", () => {
    const strokes = layoutStrokeText(FAKE_FONT, { text: "A", height: 10, letterSpacing: 1, lineSpacing: 1.2 });
    expect(strokes.length).toBe(1);
    const ys = strokes[0].map((p) => p[1]);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(10, 1);
  });

  it("advances by each glyph's own width plus letter spacing", () => {
    const one = layoutStrokeText(FAKE_FONT, { text: "A", height: 10, letterSpacing: 0, lineSpacing: 1.2 });
    const two = layoutStrokeText(FAKE_FONT, { text: "AA", height: 10, letterSpacing: 0, lineSpacing: 1.2 });
    expect(two.length).toBe(2);
    const w1 = Math.max(...one[0].map((p) => p[0])) - Math.min(...one[0].map((p) => p[0]));
    const spanTwo = Math.max(...two.flat().map((p) => p[0])) - Math.min(...two.flat().map((p) => p[0]));
    expect(spanTwo).toBeGreaterThan(w1 * 1.5);
  });

  it("skips unknown characters gracefully", () => {
    expect(() => layoutStrokeText(FAKE_FONT, { text: "AZ", height: 10, letterSpacing: 1, lineSpacing: 1.2 })).not.toThrow();
  });
});

describe("generateStitches with a line font", () => {
  const text: TextElement = {
    id: "t1",
    kind: "text",
    x: 0,
    y: 0,
    color: "#000000",
    mode: "satin",
    angle: 0,
    density: 0.4,
    underlay: false,
    text: "AB",
    fontId: "stroke:fake",
    height: 8,
    letterSpacing: 1,
    lineSpacing: 1.2,
  };

  it("sews the strokes as plain stitches, ignoring fill mode", () => {
    const strokeFonts = new Map([["stroke:fake", FAKE_FONT]]);
    const d = generateStitches([text], new Map(), "jersey", strokeFonts);
    expect(d.stitches.length).toBeGreaterThan(0);
    expect(d.stitches.every((s) => (s[2] & STITCH) === STITCH || s[2] !== 0)).toBe(true);
    expect(d.blockColors).toEqual(["#000000"]);
  });

  it("produces nothing when the font data is missing", () => {
    const d = generateStitches([text], new Map(), "jersey", new Map());
    expect(d.stitches.length).toBe(0);
  });
});

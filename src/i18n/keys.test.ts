import { describe, expect, it } from "vitest";
import { de } from "./de";
import { en } from "./en";
import { PLACEMENTS } from "../designer/placements";

const has = (k: string) => k in de && k in en;

describe("translations", () => {
  it("have every dynamically built key in both languages", () => {
    const keys = [
      ...["text", "shape", "svg", "monogram"].map((k) => `help.kind.${k}`),
      ...["none", "circle", "diamond", "rect"].map((k) => `frame.${k}`),
      ...["heart", "circle", "rect", "star", "diamond"].map((k) => `shape.${k}`),
      ...["fill", "fill-outline", "fill-satin", "satin", "outline", "applique"].map((k) => `mode.${k}`),
      ...PLACEMENTS.flatMap((p) => [`placement.${p.id}`, `placement.${p.id}.how`]),
      ...["applique.place", "applique.trim"].flatMap((n) => [`note.${n}`, `noteShort.${n}`]),
      ...["bold", "rounded", "condensed", "serif", "script", "hand", "display", "custom"].map((c) => `font.cat.${c}`),
    ];
    expect(keys.filter((k) => !has(k))).toEqual([]);
  });

  it("use the same placeholders in German and English", () => {
    const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
    const diff = Object.keys(de).filter((k) => ph(de[k as keyof typeof de]) !== ph(en[k as keyof typeof en]));
    expect(diff).toEqual([]);
  });
});

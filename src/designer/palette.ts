/**
 * Thread colour ranges.
 * - Brother Embroidery thread: data from Respira (Apache-2.0)
 * - Madeira Polyneon 40, Classic Rayon 40, Frosted Matt 40: colour values from
 *   the Ink/Stitch palette files (https://inkstitch.org). Screen colours are
 *   approximations of the real thread.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import brotherColorData from "../data/BrotherColor.json";
import polyneon from "../data/madeira-polyneon.json";
import rayon from "../data/madeira-rayon.json";
import matt from "../data/madeira-matt.json";

export type PaletteId = "madeira-polyneon" | "madeira-rayon" | "madeira-matt" | "brother";

export interface ThreadColor {
  /** Unique id "palette:code". */
  id: string;
  palette: PaletteId;
  hex: string;
  name: string;
  code: string;
}

export interface Palette {
  id: PaletteId;
  /** Full name, e.g. "Madeira Polyneon 40". */
  title: string;
  /** Short line name shown next to thread numbers. */
  short: string;
  colors: ThreadColor[];
}

type Raw = { code: string; name: string; hex: string };
const make = (palette: PaletteId, raw: Raw[]): ThreadColor[] =>
  raw.map((c) => ({ ...c, palette, id: `${palette}:${c.code}` }));

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());

export const PALETTES: Palette[] = [
  { id: "madeira-polyneon", title: "Madeira Polyneon 40", short: "Polyneon", colors: make("madeira-polyneon", polyneon) },
  { id: "madeira-rayon", title: "Madeira Classic Rayon 40", short: "Rayon", colors: make("madeira-rayon", rayon) },
  { id: "madeira-matt", title: "Madeira Frosted Matt 40", short: "Frosted Matt", colors: make("madeira-matt", matt) },
  {
    id: "brother",
    title: "Brother Embroidery",
    short: "Brother",
    colors: make(
      "brother",
      (brotherColorData as Array<{ R: number; G: number; B: number; ColorName: string; ColorCode: string }>).map(
        (c) => ({
          code: c.ColorCode,
          name: titleCase(c.ColorName),
          hex: "#" + [c.R, c.G, c.B].map((v) => v.toString(16).padStart(2, "0")).join(""),
        }),
      ),
    ),
  },
];

const byId = new Map<string, ThreadColor>();
for (const p of PALETTES) for (const c of p.colors) byId.set(c.id, c);

export const threadById = (id: string) => byId.get(id);
export const paletteById = (id: PaletteId) => PALETTES.find((p) => p.id === id)!;

/** "Red (Polyneon 1800)" */
export function threadLabel(t: ThreadColor): string {
  return `${t.name} (${paletteById(t.palette).short} ${t.code})`;
}

// ---- user settings: active range and "my threads" ----

export type PaletteView = PaletteId | "mine";

interface ThreadState {
  view: PaletteView;
  mine: string[];
  setView: (v: PaletteView) => void;
  toggleMine: (id: string) => void;
}

export const useThreadStore = create<ThreadState>()(
  persist(
    (set) => ({
      view: "madeira-polyneon",
      mine: [],
      setView: (view) => set({ view }),
      toggleMine: (id) =>
        set((s) => ({ mine: s.mine.includes(id) ? s.mine.filter((x) => x !== id) : [...s.mine, id] })),
    }),
    { name: "stichwerk-threads" },
  ),
);

export function myThreads(): ThreadColor[] {
  return useThreadStore
    .getState()
    .mine.map((id) => byId.get(id))
    .filter((c): c is ThreadColor => !!c);
}

/** The colours new elements and imports should snap to. */
export function preferredColors(): ThreadColor[] {
  const mine = myThreads();
  if (mine.length) return mine;
  const view = useThreadStore.getState().view;
  return paletteById(view === "mine" ? "madeira-polyneon" : view).colors;
}

/** Find the thread for a colour: my threads first, then the active range, then all. */
export function threadInfo(hex: string): ThreadColor | undefined {
  const view = useThreadStore.getState().view;
  return (
    myThreads().find((c) => c.hex === hex) ??
    (view !== "mine" ? paletteById(view).colors.find((c) => c.hex === hex) : undefined) ??
    PALETTES.flatMap((p) => p.colors).find((c) => c.hex === hex)
  );
}

export function colorLabel(hex: string | undefined): string {
  if (!hex) return "?";
  const t = threadInfo(hex);
  return t ? threadLabel(t) : hex;
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/** Perceptually weighted ("redmean") colour distance. */
export function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  const rm = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
}

export function nearestThread(hex: string, candidates = preferredColors()): ThreadColor {
  let best = candidates[0];
  let bestD = Infinity;
  for (const c of candidates) {
    const d = colorDistance(hex, c.hex);
    if (d < bestD) [bestD, best] = [d, c];
  }
  return best;
}

/** Default colour for new elements: black from the preferred range. */
export function defaultColor(): string {
  return nearestThread("#000000").hex;
}

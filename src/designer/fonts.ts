/**
 * Font registry. Bundled fonts live in public/fonts
 * (SIL Open Font License, see public/fonts/LICENSE-OFL.txt).
 */

import opentype from "opentype.js";
import { create } from "zustand";

export type FontCategory =
  | "bold"
  | "rounded"
  | "condensed"
  | "serif"
  | "script"
  | "hand"
  | "display"
  | "custom";

export interface FontInfo {
  id: string;
  name: string;
  category: FontCategory;
  /** Smallest capital-letter height (mm) that still sews cleanly in satin/fill. */
  minHeight: number;
  /** File inside public/fonts; undefined for fonts the user loaded. */
  file?: string;
}

const f = (id: string, name: string, category: FontCategory, minHeight: number): FontInfo => ({
  id,
  name,
  category,
  minHeight,
  file: `${id}.woff`,
});

/** Bold, open fonts that embroider well. Licences: public/fonts/FONTS.md */
export const BUNDLED_FONTS: FontInfo[] = [
  f("montserrat-800", "Montserrat ExtraBold", "bold", 6),
  f("poppins-800", "Poppins ExtraBold", "bold", 6),
  f("archivo-black-400", "Archivo Black", "bold", 6),
  f("rubik-800", "Rubik ExtraBold", "bold", 6),
  f("fredoka-600", "Fredoka SemiBold", "rounded", 6),
  f("nunito-900", "Nunito Black", "rounded", 6),
  f("baloo-2-800", "Baloo 2 ExtraBold", "rounded", 6),
  f("oswald-700", "Oswald Bold", "condensed", 8),
  f("bebas-neue-400", "Bebas Neue", "condensed", 8),
  f("anton-400", "Anton", "condensed", 8),
  f("roboto-slab-700", "Roboto Slab Bold", "serif", 7),
  f("alfa-slab-one-400", "Alfa Slab One", "serif", 7),
  f("cinzel-800", "Cinzel ExtraBold", "serif", 8),
  f("playfair-display-800", "Playfair Display ExtraBold", "serif", 10),
  f("abril-fatface-400", "Abril Fatface", "serif", 10),
  f("pacifico-400", "Pacifico", "script", 8),
  f("lobster-400", "Lobster", "script", 8),
  f("kaushan-script-400", "Kaushan Script", "script", 10),
  f("dancing-script-700", "Dancing Script Bold", "script", 10),
  f("yellowtail-400", "Yellowtail", "script", 12),
  f("satisfy-400", "Satisfy", "script", 12),
  f("permanent-marker-400", "Permanent Marker", "hand", 8),
  f("caveat-700", "Caveat Bold", "hand", 10),
  f("caveat-brush-400", "Caveat Brush", "hand", 10),
  f("graduate-400", "Graduate (College)", "display", 7),
  f("bungee-400", "Bungee", "display", 6),
  f("luckiest-guy-400", "Luckiest Guy", "display", 6),
  f("lilita-one-400", "Lilita One", "display", 6),
  f("bangers-400", "Bangers", "display", 7),
  f("righteous-400", "Righteous", "display", 8),
];

export const FONT_CATEGORIES: FontCategory[] = [
  "bold",
  "rounded",
  "condensed",
  "serif",
  "script",
  "hand",
  "display",
  "custom",
];

export const DEFAULT_FONT_ID = BUNDLED_FONTS[0].id;

const cache = new Map<string, Promise<opentype.Font>>();

interface CustomFontState {
  customFonts: FontInfo[];
  add: (info: FontInfo) => void;
}

/** Fonts loaded by the user are kept for the current session only. */
export const useCustomFonts = create<CustomFontState>((set) => ({
  customFonts: [],
  add: (info) =>
    set((s) => ({ customFonts: [...s.customFonts.filter((f) => f.id !== info.id), info] })),
}));

export function isFontAvailable(id: string): boolean {
  return (
    BUNDLED_FONTS.some((f) => f.id === id) ||
    useCustomFonts.getState().customFonts.some((f) => f.id === id)
  );
}

export class FontLoadError extends Error {}

export function loadFont(id: string): Promise<opentype.Font> {
  const key = isFontAvailable(id) ? id : DEFAULT_FONT_ID;
  const cached = cache.get(key);
  if (cached) return cached;
  const info = BUNDLED_FONTS.find((f) => f.id === key) ?? BUNDLED_FONTS[0];
  const promise = fetch(`${import.meta.env.BASE_URL}fonts/${info.file}`)
    .then((r) => {
      if (!r.ok) throw new FontLoadError(info.name);
      return r.arrayBuffer();
    })
    .then((buf) => opentype.parse(buf));
  promise.catch(() => cache.delete(key));
  cache.set(key, promise);
  return promise;
}

export async function registerCustomFont(file: File): Promise<FontInfo> {
  const buf = await file.arrayBuffer();
  const font = opentype.parse(buf);
  if (!font.supported) throw new Error("font-unsupported");
  const info: FontInfo = {
    id: `custom:${file.name}`,
    name: file.name.replace(/\.[^.]+$/, ""),
    category: "custom",
    minHeight: 7,
  };
  registerFontFace(info.id, buf);
  cache.set(info.id, Promise.resolve(font));
  useCustomFonts.getState().add(info);
  return info;
}

export function fontInfo(id: string): FontInfo {
  return (
    BUNDLED_FONTS.find((x) => x.id === id) ??
    useCustomFonts.getState().customFonts.find((x) => x.id === id) ??
    BUNDLED_FONTS[0]
  );
}

/** CSS font-family name used for previews in the font picker. */
export const cssFontFamily = (id: string) => `sw-${id.replace(/[^a-z0-9-]/gi, "_")}`;

const faces = new Set<string>();

function registerFontFace(id: string, source: string | ArrayBuffer) {
  if (faces.has(id) || typeof FontFace === "undefined") return;
  faces.add(id);
  const face = new FontFace(cssFontFamily(id), typeof source === "string" ? `url(${source})` : source);
  face
    .load()
    .then((loaded) => document.fonts.add(loaded))
    .catch(() => faces.delete(id));
}

/** Load all bundled fonts for the preview in the font picker (once). */
export function loadPreviewFaces() {
  for (const info of BUNDLED_FONTS)
    registerFontFace(info.id, `${import.meta.env.BASE_URL}fonts/${info.file}`);
}

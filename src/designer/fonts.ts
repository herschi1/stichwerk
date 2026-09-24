/**
 * Font registry. Bundled fonts live in public/fonts
 * (SIL Open Font License, see public/fonts/LICENSE-OFL.txt).
 */

import opentype from "opentype.js";
import { create } from "zustand";
import type { TranslationKey } from "../i18n";

export interface FontInfo {
  id: string;
  name: string;
  /** Short style hint shown next to the name. */
  styleKey?: TranslationKey;
  /** File inside public/fonts; undefined for fonts the user loaded. */
  file?: string;
}

export const BUNDLED_FONTS: FontInfo[] = [
  { id: "montserrat-800", name: "Montserrat ExtraBold", styleKey: "font.style.bold", file: "montserrat-800.woff" },
  { id: "fredoka-600", name: "Fredoka SemiBold", styleKey: "font.style.rounded", file: "fredoka-600.woff" },
  { id: "roboto-slab-700", name: "Roboto Slab Bold", styleKey: "font.style.serif", file: "roboto-slab-700.woff" },
  { id: "pacifico-400", name: "Pacifico", styleKey: "font.style.script", file: "pacifico-400.woff" },
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
  const font = opentype.parse(await file.arrayBuffer());
  if (!font.supported) throw new Error("font-unsupported");
  const info: FontInfo = { id: `custom:${file.name}`, name: file.name.replace(/\.[^.]+$/, "") };
  cache.set(info.id, Promise.resolve(font));
  useCustomFonts.getState().add(info);
  return info;
}

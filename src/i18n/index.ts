/**
 * Minimal i18n: every visible text comes from de.ts / en.ts.
 * The language follows the browser on first visit and is remembered.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { de, type TranslationKey } from "./de";
import { en } from "./en";

export type Lang = "de" | "en";

const dictionaries: Record<Lang, Record<TranslationKey, string>> = { de, en };

function browserLang(): Lang {
  if (typeof navigator === "undefined") return "de";
  return navigator.language?.toLowerCase().startsWith("de") ? "de" : "en";
}

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLang = create<LangState>()(
  persist(
    (set) => ({
      lang: browserLang(),
      setLang: (lang) => set({ lang }),
    }),
    { name: "stichwerk-lang" },
  ),
);

export type TFunction = (key: TranslationKey, vars?: Record<string, string | number>) => string;

export function translate(lang: Lang, key: TranslationKey, vars?: Record<string, string | number>) {
  let text: string = dictionaries[lang][key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
}

/** React hook returning the translate function for the current language. */
export function useT(): TFunction {
  const lang = useLang((s) => s.lang);
  return (key, vars) => translate(lang, key, vars);
}

export type { TranslationKey };

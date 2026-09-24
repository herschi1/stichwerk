import { useEffect, useRef, useState } from "react";
import { useT, type TranslationKey } from "../i18n";
import {
  BUNDLED_FONTS,
  FONT_CATEGORIES,
  cssFontFamily,
  fontInfo,
  loadPreviewFaces,
  useCustomFonts,
} from "../designer/fonts";

interface Props {
  value: string;
  sample: string;
  onChange: (id: string) => void;
  onUpload: () => void;
}

export function FontPicker({ value, sample, onChange, onUpload }: Props) {
  const t = useT();
  const customFonts = useCustomFonts((s) => s.customFonts);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const current = fontInfo(value);
  const text = sample.split("\n")[0].trim().slice(0, 18) || "Abc";

  // Load the font files for the previews once, and also the current one right away.
  useEffect(() => {
    loadPreviewFaces();
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const all = [...BUNDLED_FONTS, ...customFonts];

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-denim-200 bg-white px-2 py-1.5 text-left hover:border-denim-500"
      >
        <span className="min-w-0">
          <span className="block truncate text-xl leading-tight" style={{ fontFamily: `${cssFontFamily(current.id)}, sans-serif` }}>
            {text}
          </span>
          <span className="block truncate text-xs text-denim-700">{current.name}</span>
        </span>
        <span aria-hidden className="text-denim-500">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("edit.font")}
          className="absolute left-0 right-0 z-20 mt-1 max-h-[26rem] overflow-y-auto rounded-lg bg-white p-2 shadow-xl ring-1 ring-denim-200"
        >
          {FONT_CATEGORIES.map((cat) => {
            const fonts = all.filter((f) => f.category === cat);
            if (!fonts.length) return null;
            return (
              <div key={cat} className="mb-2">
                <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-denim-500">
                  {t(`font.cat.${cat}` as TranslationKey)}
                </p>
                {fonts.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    role="option"
                    aria-selected={f.id === value}
                    onClick={() => {
                      onChange(f.id);
                      setOpen(false);
                    }}
                    className={
                      "flex w-full items-baseline justify-between gap-3 rounded-md px-2 py-1.5 text-left " +
                      (f.id === value ? "bg-thread-100" : "hover:bg-denim-50")
                    }
                  >
                    <span
                      className="min-w-0 truncate text-2xl leading-snug text-ink"
                      style={{ fontFamily: `${cssFontFamily(f.id)}, sans-serif` }}
                    >
                      {text}
                    </span>
                    <span className="flex-shrink-0 text-right text-[11px] leading-tight text-denim-700">
                      {f.name}
                      <br />
                      {t("edit.fontFrom", { n: f.minHeight })}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onUpload();
            }}
            className="w-full rounded-md px-2 py-2 text-left text-sm font-medium text-denim-900 hover:bg-denim-50"
          >
            {t("edit.fontUpload")}
          </button>
        </div>
      )}
    </div>
  );
}

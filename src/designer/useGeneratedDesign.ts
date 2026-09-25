import { useEffect, useState } from "react";
import type opentype from "opentype.js";
import { generateStitches, type GeneratedDesign } from "../engine/compose";
import type { DesignElement } from "./types";
import type { FabricProfileId } from "../engine/profiles";
import { loadFont, useCustomFonts } from "./fonts";

const EMPTY: GeneratedDesign = { stitches: [], travels: 0, boxes: {}, blockColors: [], width: 0, height: 0 };

/** Regenerates the stitches (debounced) whenever the design changes. */
export function useGeneratedDesign(elements: DesignElement[], fabric: FabricProfileId) {
  const customFonts = useCustomFonts((s) => s.customFonts);
  const [design, setDesign] = useState<GeneratedDesign>(EMPTY);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const fonts = new Map<string, opentype.Font>();
        for (const el of elements)
          if (el.kind === "text" && !fonts.has(el.fontId)) fonts.set(el.fontId, await loadFont(el.fontId));
        const result = generateStitches(elements, fonts, fabric);
        if (!cancelled) {
          setDesign(result);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e);
      }
    }, 80);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [elements, customFonts, fabric]);

  return { design, error };
}

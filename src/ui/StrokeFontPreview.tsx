import { useEffect, useState } from "react";
import { loadStrokeFont } from "../designer/strokeFonts";
import { layoutStrokeText } from "../engine/strokeText";

/** Small inline preview of a line font: draws the actual glyph strokes as an SVG. */
export function StrokeFontPreview({ fontId, text, className }: { fontId: string; text: string; className?: string }) {
  const [strokes, setStrokes] = useState<[number, number][][] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadStrokeFont(fontId)
      .then((font) => {
        if (cancelled) return;
        setStrokes(layoutStrokeText(font, { text: text || "Abc", height: 20, letterSpacing: 2, lineSpacing: 1.2, align: "left" }));
      })
      .catch(() => setStrokes([]));
    return () => {
      cancelled = true;
    };
  }, [fontId, text]);

  if (!strokes) return <span className={className} aria-hidden />;
  if (!strokes.length) return <span className={className}>{text}</span>;

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const s of strokes)
    for (const [x, y] of s) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  const pad = 2;
  const w = Math.max(1, maxX - minX + pad * 2);
  const h = Math.max(1, maxY - minY + pad * 2);

  return (
    <svg
      viewBox={`${minX - pad} ${minY - pad} ${w} ${h}`}
      className={className}
      style={{ height: "1.6em", width: "auto", maxWidth: "100%" }}
      preserveAspectRatio="xMinYMid meet"
    >
      {strokes.map((s, i) => (
        <polyline
          key={i}
          points={s.map((p) => p.join(",")).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

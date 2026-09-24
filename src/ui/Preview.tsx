import { useEffect, useRef, useState } from "react";
import { MOVE } from "../engine/constants";
import type { GeneratedDesign } from "../engine/compose";
import { useT, type TranslationKey } from "../i18n";
import { usePreviewSettings, FABRICS } from "./usePreviewSettings";

/** Brother PP1 embroidery area in mm (used until the machine reports its own). */
export const DEFAULT_HOOP_MM = 100;

function shade(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.max(0, Math.min(255, Math.round(v * factor))),
  );
  return `rgb(${c.join(",")})`;
}

function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  design: GeneratedDesign,
  fabric: string,
  showJumps: boolean,
  zoom: number,
  pan: { x: number; y: number },
  hoop: { w: number; h: number },
  sewnFraction: number | null,
) {
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const scale = Math.min(w / (hoop.w + 24), h / (hoop.h + 24)) * zoom; // px per mm
  ctx.translate(w / 2 + pan.x, h / 2 + pan.y);
  ctx.scale(scale, scale);

  // Hoop: fabric inside, a double ring outside
  const hw = hoop.w / 2;
  const hh = hoop.h / 2;
  const r = 6;
  const round = (inset: number) => {
    ctx.beginPath();
    ctx.roundRect(-hw - inset, -hh - inset, hoop.w + 2 * inset, hoop.h + 2 * inset, r + inset);
  };
  round(5);
  ctx.fillStyle = "#cdd5e3";
  ctx.fill();
  round(2);
  ctx.fillStyle = "#3a4d6e";
  ctx.fill();
  round(0);
  ctx.fillStyle = fabric;
  ctx.fill();

  // 10 mm grid, subtle
  ctx.save();
  round(0);
  ctx.clip();
  const light = parseInt(fabric.slice(1), 16) > 0x888888;
  ctx.strokeStyle = light ? "rgba(23,32,51,0.08)" : "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1 / scale;
  ctx.beginPath();
  for (let v = 0; v <= hw; v += 10)
    for (const x of v === 0 ? [0] : [v, -v]) {
      ctx.moveTo(x, -hh);
      ctx.lineTo(x, hh);
    }
  for (let v = 0; v <= hh; v += 10)
    for (const y of v === 0 ? [0] : [v, -v]) {
      ctx.moveTo(-hw, y);
      ctx.lineTo(hw, y);
    }
  ctx.stroke();
  ctx.restore();

  // Stitches: a darker underside first, then the thread colour – reads as thread.
  const st = design.stitches;
  // While sewing, stitches that are still to come are drawn faded.
  const sewnUntil = sewnFraction === null ? st.length : Math.round(sewnFraction * st.length);
  const threadW = Math.max(0.3, 1.2 / scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const pass of [0, 1]) {
    let i = 0;
    while (i < st.length) {
      const block = st[i][3];
      const color = design.blockColors[block] ?? "#000000";
      ctx.beginPath();
      let started = false;
      const faded = i >= sewnUntil;
      ctx.globalAlpha = faded ? 0.28 : 1;
      for (; i < st.length && st[i][3] === block && (i >= sewnUntil) === faded; i++) {
        const [x, y, cmd] = st[i];
        if (!started || cmd & MOVE) {
          ctx.moveTo(x / 10, y / 10);
          started = true;
        } else ctx.lineTo(x / 10, y / 10);
      }
      ctx.globalAlpha = faded ? 0.28 : 1;
      ctx.strokeStyle = pass === 0 ? shade(color, 0.55) : color;
      ctx.lineWidth = pass === 0 ? threadW * 1.45 : threadW;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  if (showJumps) {
    ctx.beginPath();
    for (let i = 1; i < st.length; i++) {
      if (st[i][2] & MOVE) {
        ctx.moveTo(st[i - 1][0] / 10, st[i - 1][1] / 10);
        ctx.lineTo(st[i][0] / 10, st[i][1] / 10);
      }
    }
    ctx.setLineDash([1.2, 1]);
    ctx.lineWidth = 0.15;
    ctx.strokeStyle = light ? "rgba(23,32,51,0.55)" : "rgba(255,255,255,0.6)";
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

export function Preview({
  design,
  hoop,
  sewnFraction,
  fitsHoop,
}: {
  design: GeneratedDesign;
  hoop: { w: number; h: number };
  sewnFraction: number | null;
  fitsHoop: boolean;
}) {
  const t = useT();
  const { fabric, setFabric, showJumps, setShowJumps } = usePreviewSettings();
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 400, h: 400 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(size.w * dpr);
    c.height = Math.round(size.h * dpr);
    const ctx = c.getContext("2d");
    if (ctx) draw(ctx, size.w, size.h, design, fabric, showJumps, zoom, pan, hoop, sewnFraction);
  }, [design, fabric, showJumps, zoom, pan, size, hoop, sewnFraction]);

  return (
    <div className="flex h-full min-h-[420px] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <label className="flex items-center gap-2 text-denim-700">
          {t("preview.fabric")}
          <select
            className="rounded-md border border-denim-200 bg-white px-2 py-1 text-sm"
            value={fabric}
            onChange={(e) => setFabric(e.target.value)}
          >
            {FABRICS.map((f) => (
              <option key={f.hex} value={f.hex}>
                {t(f.key as TranslationKey)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-denim-700">
          <input
            type="checkbox"
            className="accent-thread-500"
            checked={showJumps}
            onChange={(e) => setShowJumps(e.target.checked)}
          />
          {t("preview.jumps")}
        </label>
        <div className="ml-auto flex overflow-hidden rounded-md ring-1 ring-denim-200">
          {[
            { label: "−", title: t("preview.zoomOut"), fn: () => setZoom((z) => Math.max(0.5, z / 1.25)) },
            {
              label: "⤢",
              title: t("preview.fit"),
              fn: () => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              },
            },
            { label: "+", title: t("preview.zoomIn"), fn: () => setZoom((z) => Math.min(8, z * 1.25)) },
          ].map((b) => (
            <button
              key={b.label}
              type="button"
              title={b.title}
              aria-label={b.title}
              onClick={b.fn}
              className="w-9 bg-white py-1 text-denim-900 hover:bg-denim-100"
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={wrap}
        className="relative flex-1 cursor-grab overflow-hidden rounded-xl bg-denim-100 active:cursor-grabbing"
        onWheel={(e) => setZoom((z) => Math.min(8, Math.max(0.5, z * (e.deltaY < 0 ? 1.1 : 1 / 1.1))))}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current) setPan({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
        }}
        onPointerUp={() => (drag.current = null)}
      >
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
        {design.stitches.length === 0 && (
          <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-sm text-denim-700">
            {t("preview.empty")}
          </p>
        )}
      </div>
      {!fitsHoop && design.stitches.length > 0 && (
        <p className="rounded-md bg-thread-100 px-3 py-2 text-sm text-denim-900">{t("preview.outside", { w: Math.round(hoop.w), h: Math.round(hoop.h) })}</p>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { MOVE } from "../engine/constants";
import type { GeneratedDesign } from "../engine/compose";
import { useT, type TranslationKey } from "../i18n";
import { usePreviewSettings, FABRICS } from "./usePreviewSettings";
import type { DesignElement } from "../designer/types";
import { SimulationBar, useSimulation } from "./Simulation";
import { HelpButton } from "./HelpButton";
import {
  type DragStart,
  type Guides,
  type View,
  dragMove,
  dragRotate,
  dragScale,
  drawSelection,
  hitElement,
  hitHandle,
  toMm,
} from "./selection";

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
  view: View,
  hoop: { w: number; h: number },
  sewnUntil: number | null,
) {
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const scale = view.scale; // px per mm
  ctx.translate(view.ox, view.oy);
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
  const until = sewnUntil === null ? st.length : sewnUntil;
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
      const faded = i >= until;
      ctx.globalAlpha = faded ? 0.28 : 1;
      for (; i < st.length && st[i][3] === block && (i >= until) === faded; i++) {
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

  // needle position while simulating or sewing
  if (sewnUntil !== null && sewnUntil > 0 && sewnUntil <= st.length) {
    const [x, y] = st[sewnUntil - 1];
    ctx.beginPath();
    ctx.arc(x / 10, y / 10, 1.4, 0, Math.PI * 2);
    ctx.lineWidth = 0.35;
    ctx.strokeStyle = "#c98a12";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x / 10 - 2.4, y / 10);
    ctx.lineTo(x / 10 + 2.4, y / 10);
    ctx.moveTo(x / 10, y / 10 - 2.4);
    ctx.lineTo(x / 10, y / 10 + 2.4);
    ctx.lineWidth = 0.2;
    ctx.stroke();
  }
}

interface PreviewProps {
  design: GeneratedDesign;
  hoop: { w: number; h: number };
  sewnFraction: number | null;
  fitsHoop: boolean;
  elements: DesignElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onEdit: (id: string, patch: Partial<DesignElement>, key: string) => void;
  onCenterDesign: () => void;
}

type DragState =
  | { mode: "pan"; sx: number; sy: number; pan: { x: number; y: number }; moved: boolean }
  | { mode: "move" | "scale" | "rotate"; start: DragStart; key: string };

export function Preview({
  design,
  hoop,
  sewnFraction,
  fitsHoop,
  elements,
  selectedId,
  onSelect,
  onEdit,
  onCenterDesign,
}: PreviewProps) {
  const t = useT();
  const { fabric, setFabric, showJumps, setShowJumps } = usePreviewSettings();
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 400, h: 400 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [guides, setGuides] = useState<Guides>({ x: false, y: false });
  const [cursor, setCursor] = useState("grab");
  const drag = useRef<DragState | null>(null);
  const sim = useSimulation(design);

  const view: View = {
    scale: Math.min(size.w / (hoop.w + 24), size.h / (hoop.h + 24)) * zoom,
    ox: size.w / 2 + pan.x,
    oy: size.h / 2 + pan.y,
  };
  const selected = elements.find((e) => e.id === selectedId) ?? null;
  const selectedBox = selected ? design.boxes[selected.id] : undefined;

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
    if (!ctx) return;
    const sewnUntil = sim.active
      ? sim.index
      : sewnFraction === null
        ? null
        : Math.round(sewnFraction * design.stitches.length);
    draw(ctx, size.w, size.h, design, fabric, showJumps, view, hoop, sewnUntil);
    if (!sim.active && selected && selectedBox && selectedBox.w > 0) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawSelection(ctx, view, selected, selectedBox, guides, hoop);
    }
    // view is derived from size/zoom/pan, which are in the list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design, fabric, showJumps, zoom, pan, size, hoop, sewnFraction, selected, selectedBox, guides, sim.active, sim.index]);

  const pointerMm = (e: React.PointerEvent) => {
    const r = wrap.current!.getBoundingClientRect();
    return toMm(view, e.clientX - r.left, e.clientY - r.top);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const p = pointerMm(e);
    e.currentTarget.setPointerCapture(e.pointerId);
    const key = `drag:${Date.now()}`;
    if (sim.active) {
      drag.current = { mode: "pan", sx: e.clientX, sy: e.clientY, pan, moved: true };
      return;
    }
    if (selected && selectedBox) {
      const handle = hitHandle(view, selected, selectedBox, p);
      if (handle) {
        drag.current = { mode: handle, start: { el: selected, box: selectedBox, p }, key };
        return;
      }
    }
    const hit = hitElement(view, elements, design.boxes, p);
    if (hit) {
      onSelect(hit.id);
      drag.current = { mode: "move", start: { el: hit, box: design.boxes[hit.id], p }, key };
      return;
    }
    drag.current = { mode: "pan", sx: e.clientX, sy: e.clientY, pan, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const p = pointerMm(e);
    if (!d) {
      if (sim.active) return setCursor("grab");
      // hover feedback
      if (selected && selectedBox && hitHandle(view, selected, selectedBox, p))
        setCursor(hitHandle(view, selected, selectedBox, p) === "rotate" ? "crosshair" : "nwse-resize");
      else setCursor(hitElement(view, elements, design.boxes, p) ? "move" : "grab");
      return;
    }
    if (d.mode === "pan") {
      const dx = e.clientX - d.sx;
      const dy = e.clientY - d.sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
      setPan({ x: d.pan.x + dx, y: d.pan.y + dy });
      return;
    }
    const id = d.start.el.id;
    if (d.mode === "move") {
      const { patch, guides: g } = dragMove(view, d.start, p, e.altKey);
      setGuides(g);
      onEdit(id, patch, d.key);
    } else if (d.mode === "scale") onEdit(id, dragScale(d.start, p), d.key);
    else onEdit(id, dragRotate(d.start, p, e.shiftKey), d.key);
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (d?.mode === "pan" && !d.moved) onSelect(null);
    drag.current = null;
    setGuides({ x: false, y: false });
  };

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
        <HelpButton topic="help.preview" />
        <button
          type="button"
          onClick={onCenterDesign}
          disabled={design.stitches.length === 0}
          className="ml-auto rounded-md bg-white px-2.5 py-1 text-sm text-denim-900 ring-1 ring-denim-200 hover:bg-denim-50 disabled:opacity-40"
        >
          {t("preview.centerDesign")}
        </button>
        <div className="flex overflow-hidden rounded-md ring-1 ring-denim-200">
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
        className="relative flex-1 overflow-hidden rounded-xl bg-denim-100"
        onWheel={(e) => setZoom((z) => Math.min(8, Math.max(0.5, z * (e.deltaY < 0 ? 1.1 : 1 / 1.1))))}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ cursor, touchAction: "none" }}
      >
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
        {design.stitches.length === 0 && (
          <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-sm text-denim-700">
            {t("preview.empty")}
          </p>
        )}
      </div>
      <SimulationBar sim={sim} design={design} />
      {!sim.active && <p className="text-xs text-denim-500">{t("preview.hint")}</p>}
      {!fitsHoop && design.stitches.length > 0 && (
        <p className="rounded-md bg-thread-100 px-3 py-2 text-sm text-denim-900">{t("preview.outside", { w: Math.round(hoop.w), h: Math.round(hoop.h) })}</p>
      )}
    </div>
  );
}

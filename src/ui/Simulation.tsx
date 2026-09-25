/**
 * Plays the sewing order back on the preview, stitch by stitch, so jumps,
 * colour changes and the order of the parts can be checked before sewing.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { GeneratedDesign } from "../engine/compose";
import { designStats } from "../engine/stats";
import { MOVE } from "../engine/constants";
import { colorLabel } from "../designer/palette";
import { useLang, useT } from "../i18n";

/** Stitches per second for each speed step. */
const SPEEDS = [20, 80, 300, 1200];

export interface Simulation {
  active: boolean;
  playing: boolean;
  index: number;
  speed: number;
  stopAtColors: boolean;
  start: () => void;
  close: () => void;
  toggle: () => void;
  seek: (i: number) => void;
  setSpeed: (i: number) => void;
  setStopAtColors: (v: boolean) => void;
}

export function useSimulation(design: GeneratedDesign): Simulation {
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [stopAtColors, setStopAtColors] = useState(true);
  const pos = useRef(0);
  const total = design.stitches.length;

  // keep the position valid when the design changes
  useEffect(() => {
    if (index > total) {
      pos.current = total;
      setIndex(total);
    }
  }, [total, index]);

  useEffect(() => {
    if (!active || !playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const from = Math.floor(pos.current);
      let next = pos.current + SPEEDS[speed] * dt;
      let stop = false;
      if (next >= total) {
        next = total;
        stop = true;
      }
      // pause at a colour change, like the machine does
      if (stopAtColors) {
        const st = design.stitches;
        for (let i = Math.max(1, from + 1); i < Math.floor(next); i++) {
          if (st[i][3] !== st[i - 1][3]) {
            next = i;
            stop = true;
            break;
          }
        }
      }
      pos.current = next;
      setIndex(Math.floor(next));
      if (stop) setPlaying(false);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, playing, speed, stopAtColors, total, design.stitches]);

  return {
    active,
    playing,
    index,
    speed,
    stopAtColors,
    start: () => {
      pos.current = 0;
      setIndex(0);
      setActive(true);
      setPlaying(true);
    },
    close: () => {
      setActive(false);
      setPlaying(false);
    },
    toggle: () => {
      if (!playing && pos.current >= total) {
        pos.current = 0;
        setIndex(0);
      }
      setPlaying(!playing);
    },
    seek: (i) => {
      pos.current = i;
      setIndex(i);
    },
    setSpeed,
    setStopAtColors,
  };
}

const btn =
  "rounded-md bg-white px-2.5 py-1 text-sm text-denim-900 ring-1 ring-denim-200 hover:bg-denim-50 disabled:opacity-40";

export function SimulationBar({ sim, design }: { sim: Simulation; design: GeneratedDesign }) {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const stats = useMemo(() => designStats(design.stitches, design.blockColors), [design]);
  const total = design.stitches.length;
  const fmt = (n: number) => n.toLocaleString(lang === "de" ? "de-AT" : "en-GB");

  if (!sim.active)
    return (
      <div>
        <button type="button" className={btn} disabled={total < 2} onClick={sim.start}>
          ▶ {t("sim.start")}
        </button>
      </div>
    );

  const i = Math.max(0, sim.index - 1);
  const blockNo = stats.blocks.findIndex((b) => i >= b.start && i <= b.end);
  const block = stats.blocks[blockNo];
  let jumpsSoFar = 0;
  for (let k = 0; k < sim.index; k++) if (design.stitches[k][2] & MOVE) jumpsSoFar++;
  const atColorChange =
    !sim.playing && sim.index > 0 && sim.index < total && design.stitches[sim.index][3] !== design.stitches[sim.index - 1][3];

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-white p-3 ring-1 ring-denim-100">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btn} onClick={sim.toggle} aria-label={sim.playing ? t("sim.pause") : t("sim.play")}>
          {sim.playing ? "⏸" : "▶"}
        </button>
        <button type="button" className={btn} onClick={() => sim.seek(0)} aria-label={t("sim.restart")} title={t("sim.restart")}>
          ⏮
        </button>
        <input
          type="range"
          min={0}
          max={total}
          value={sim.index}
          onChange={(e) => sim.seek(Number(e.target.value))}
          aria-label={t("sim.position")}
          className="min-w-40 flex-1 accent-thread-500"
        />
        <select
          className="rounded-md border border-denim-200 bg-white px-2 py-1 text-sm"
          value={sim.speed}
          aria-label={t("sim.speed")}
          onChange={(e) => sim.setSpeed(Number(e.target.value))}
        >
          <option value={0}>{t("sim.speed.slow")}</option>
          <option value={1}>{t("sim.speed.normal")}</option>
          <option value={2}>{t("sim.speed.fast")}</option>
          <option value={3}>{t("sim.speed.veryFast")}</option>
        </select>
        <button type="button" className={btn} onClick={sim.close}>
          {t("sim.close")}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-denim-900">
        <span className="tabular-nums">{t("sim.status", { cur: fmt(sim.index), total: fmt(total) })}</span>
        {block && (
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-full ring-1 ring-denim-200" style={{ background: block.color }} />
            {t("sim.color", { n: blockNo + 1, name: colorLabel(block.color) })}
          </span>
        )}
        <span className="text-denim-700">{t("sim.jumps", { n: jumpsSoFar, total: stats.jumps })}</span>
        <label className="ml-auto flex items-center gap-1.5 text-denim-700">
          <input
            type="checkbox"
            className="accent-thread-500"
            checked={sim.stopAtColors}
            onChange={(e) => sim.setStopAtColors(e.target.checked)}
          />
          {t("sim.stopAtColors")}
        </label>
      </div>
      {atColorChange && (
        <p className="rounded-md bg-thread-100 px-2 py-1.5 text-sm text-denim-950">
          {t("sim.colorChange", {
            name: colorLabel(design.blockColors[design.stitches[sim.index][3]]),
          })}
        </p>
      )}
    </div>
  );
}

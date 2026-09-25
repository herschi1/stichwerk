import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_FONT_ID } from "./fonts";
import type { DesignElement, MonogramElement, ShapeElement, SvgElement, TextElement } from "./types";
import type { PlacementId } from "./placements";
import type { ImportedSvg } from "../io/svg";
import { defaultColor, nearestThread } from "./palette";
import { DEFAULT_FABRIC, type FabricProfileId } from "../engine/profiles";

const HISTORY_LIMIT = 100;
/** Edits with the same key within this time count as one undo step. */
const COALESCE_MS = 1200;

interface DesignState {
  elements: DesignElement[];
  fabric: FabricProfileId;
  selectedId: string | null;
  /** Chosen position on the shirt (only for the placement hint). */
  placement: PlacementId | null;
  past: DesignElement[][];
  future: DesignElement[][];
  lastKey: string | null;
  lastTime: number;

  setFabric: (fabric: FabricProfileId) => void;
  addText: () => void;
  addShape: () => void;
  addMonogram: () => void;
  /** Scale the whole design around (cx, cy), then move that point to the hoop centre. */
  scaleDesign: (factor: number, cx: number, cy: number) => void;
  setPlacement: (p: PlacementId | null) => void;
  addSvg: (svg: ImportedSvg, name: string) => void;
  /** `key`: edits with the same key close together become one undo step. */
  update: (id: string, patch: Partial<DesignElement>, key?: string) => void;
  /** Move several elements at once (e.g. centre the whole design). */
  moveAll: (dx: number, dy: number) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  moveInOrder: (id: string, dir: -1 | 1) => void;
  select: (id: string | null) => void;
  replaceAll: (elements: DesignElement[], fabric?: FabricProfileId) => void;
  undo: () => void;
  redo: () => void;
}

const newId = () => Math.random().toString(36).slice(2, 10);

const fillDefaults = () => ({
  color: defaultColor(),
  x: 0,
  y: 0,
  mode: "fill" as const,
  density: 0.4,
  underlay: true,
  rotation: 0,
});

type HistoryFields = Pick<DesignState, "past" | "future" | "lastKey" | "lastTime">;

/** Record the current elements as an undo step (unless coalesced with the last one). */
function record(s: DesignState, key: string | null = null): HistoryFields {
  const now = Date.now();
  if (key && key === s.lastKey && now - s.lastTime < COALESCE_MS)
    return { past: s.past, future: [], lastKey: key, lastTime: now };
  return {
    past: [...s.past, s.elements].slice(-HISTORY_LIMIT),
    future: [],
    lastKey: key,
    lastTime: now,
  };
}

export const useDesignStore = create<DesignState>()(
  persist(
    (set) => ({
      elements: [],
      selectedId: null,
      placement: null,
      fabric: DEFAULT_FABRIC,
      past: [],
      future: [],
      lastKey: null,
      lastTime: 0,

      setFabric: (fabric) => set({ fabric }),

      addText: () =>
        set((s) => {
          const el: TextElement = {
            ...fillDefaults(),
            id: newId(),
            kind: "text",
            text: "Text",
            fontId: DEFAULT_FONT_ID,
            height: 12,
            letterSpacing: 0.3,
            lineSpacing: 1.5,
            angle: 0,
            mode: "satin",
            density: 0.3,
            align: "center",
            arc: "none",
            arcRadius: 40,
          };
          return { ...record(s), elements: [...s.elements, el], selectedId: el.id };
        }),

      addShape: () =>
        set((s) => {
          const el: ShapeElement = {
            ...fillDefaults(),
            id: newId(),
            kind: "shape",
            shape: "heart",
            width: 30,
            height: 27,
            angle: 45,
          };
          return { ...record(s), elements: [...s.elements, el], selectedId: el.id };
        }),

      addMonogram: () =>
        set((s) => {
          const color = defaultColor();
          const el: MonogramElement = {
            ...fillDefaults(),
            id: newId(),
            kind: "monogram",
            letters: "ABC",
            fontId: "cinzel-800",
            height: 18,
            style: "classic",
            letterSpacing: 1,
            frame: "circle",
            frameColor: color,
            frameWidth: 1.6,
            frameGap: 2,
            angle: 0,
            mode: "satin",
            density: 0.3,
          };
          return { ...record(s), elements: [...s.elements, el], selectedId: el.id };
        }),

      scaleDesign: (f, cx, cy) =>
        set((s) => {
          const r = (v: number) => Math.round(v * 10) / 10;
          const elements = s.elements.map((e): DesignElement => {
            const pos = { x: r((e.x - cx) * f), y: r((e.y - cy) * f) };
            switch (e.kind) {
              case "text":
                return { ...e, ...pos, height: r(e.height * f), letterSpacing: r(e.letterSpacing * f), arcRadius: r((e.arcRadius ?? 40) * f) };
              case "shape":
                return { ...e, ...pos, width: r(e.width * f), height: r(e.height * f) };
              case "svg":
                return { ...e, ...pos, width: r(e.width * f) };
              case "monogram":
                return { ...e, ...pos, height: r(e.height * f), frameGap: r(e.frameGap * f) };
            }
          });
          return { ...record(s), elements };
        }),

      setPlacement: (placement) => set({ placement }),

      addSvg: (svg, name) =>
        set((s) => {
          // Start at 60 mm on the longer side, colours snapped to the preferred threads.
          const longer = Math.max(svg.width, svg.height) || 1;
          const width = (60 * svg.width) / longer;
          const el: SvgElement = {
            ...fillDefaults(),
            id: newId(),
            kind: "svg",
            name,
            parts: svg.parts.map((p) => ({ ...p, color: nearestThread(p.color).hex })),
            sourceWidth: svg.width,
            sourceHeight: svg.height,
            width,
            singleColor: false,
            angle: 45,
          };
          return { ...record(s), elements: [...s.elements, el], selectedId: el.id };
        }),

      update: (id, patch, key) =>
        set((s) => ({
          ...record(s, key ?? `edit:${id}:${Object.keys(patch).sort().join(",")}`),
          elements: s.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as DesignElement) : e)),
        })),

      moveAll: (dx, dy) =>
        set((s) => ({
          ...record(s),
          elements: s.elements.map((e) => ({
            ...e,
            x: Math.round((e.x + dx) * 10) / 10,
            y: Math.round((e.y + dy) * 10) / 10,
          })),
        })),

      remove: (id) =>
        set((s) => ({
          ...record(s),
          elements: s.elements.filter((e) => e.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        })),

      duplicate: (id) =>
        set((s) => {
          const i = s.elements.findIndex((e) => e.id === id);
          if (i < 0) return s;
          const copy = { ...structuredClone(s.elements[i]), id: newId() };
          copy.x += 5;
          copy.y += 5;
          const elements = [...s.elements];
          elements.splice(i + 1, 0, copy);
          return { ...record(s), elements, selectedId: copy.id };
        }),

      moveInOrder: (id, dir) =>
        set((s) => {
          const i = s.elements.findIndex((e) => e.id === id);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= s.elements.length) return s;
          const elements = [...s.elements];
          [elements[i], elements[j]] = [elements[j], elements[i]];
          return { ...record(s), elements };
        }),

      select: (id) => set({ selectedId: id }),

      replaceAll: (elements, fabric) =>
        set((s) => ({
          ...record(s),
          elements,
          fabric: fabric ?? s.fabric,
          selectedId: elements[0]?.id ?? null,
        })),

      undo: () =>
        set((s) => {
          if (!s.past.length) return s;
          const elements = s.past[s.past.length - 1];
          return {
            elements,
            past: s.past.slice(0, -1),
            future: [s.elements, ...s.future].slice(0, HISTORY_LIMIT),
            lastKey: null,
            selectedId: elements.some((e) => e.id === s.selectedId) ? s.selectedId : null,
          };
        }),

      redo: () =>
        set((s) => {
          if (!s.future.length) return s;
          const [elements, ...future] = s.future;
          return {
            elements,
            past: [...s.past, s.elements].slice(-HISTORY_LIMIT),
            future,
            lastKey: null,
            selectedId: elements.some((e) => e.id === s.selectedId) ? s.selectedId : null,
          };
        }),
    }),
    {
      name: "stichwerk-design",
      // the undo history is not stored between visits
      partialize: (s) => ({
        elements: s.elements,
        selectedId: s.selectedId,
        fabric: s.fabric,
        placement: s.placement,
      }),
    },
  ),
);

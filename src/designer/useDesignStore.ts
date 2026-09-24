import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_FONT_ID } from "./fonts";
import type { DesignElement, ShapeElement, SvgElement, TextElement } from "./types";
import type { ImportedSvg } from "../io/svg";
import { defaultColor, nearestThread } from "./palette";
import { DEFAULT_FABRIC, type FabricProfileId } from "../engine/profiles";

interface DesignState {
  elements: DesignElement[];
  fabric: FabricProfileId;
  setFabric: (fabric: FabricProfileId) => void;
  selectedId: string | null;
  addText: () => void;
  addShape: () => void;
  addSvg: (svg: ImportedSvg, name: string) => void;
  update: (id: string, patch: Partial<DesignElement>) => void;
  remove: (id: string) => void;
  moveInOrder: (id: string, dir: -1 | 1) => void;
  select: (id: string | null) => void;
  replaceAll: (elements: DesignElement[], fabric?: FabricProfileId) => void;
}

const newId = () => Math.random().toString(36).slice(2, 10);

const fillDefaults = () => ({
  color: defaultColor(),
  x: 0,
  y: 0,
  mode: "fill" as const,
  density: 0.4,
  underlay: true,
});

export const useDesignStore = create<DesignState>()(
  persist(
    (set) => ({
      elements: [],
      selectedId: null,
      fabric: DEFAULT_FABRIC,
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
          };
          return { elements: [...s.elements, el], selectedId: el.id };
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
          return { elements: [...s.elements, el], selectedId: el.id };
        }),

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
          return { elements: [...s.elements, el], selectedId: el.id };
        }),

      update: (id, patch) =>
        set((s) => ({
          elements: s.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as DesignElement) : e)),
        })),

      remove: (id) =>
        set((s) => ({
          elements: s.elements.filter((e) => e.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        })),

      moveInOrder: (id, dir) =>
        set((s) => {
          const i = s.elements.findIndex((e) => e.id === id);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= s.elements.length) return s;
          const elements = [...s.elements];
          [elements[i], elements[j]] = [elements[j], elements[i]];
          return { elements };
        }),

      select: (id) => set({ selectedId: id }),
      replaceAll: (elements, fabric) =>
        set((s) => ({ elements, fabric: fabric ?? s.fabric, selectedId: elements[0]?.id ?? null })),
    }),
    { name: "stichwerk-design" },
  ),
);

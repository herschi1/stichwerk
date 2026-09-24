import { create } from "zustand";
import { persist } from "zustand/middleware";

export const FABRICS = [
  { hex: "#fbfbf8", key: "fabric.white" },
  { hex: "#b9bcc0", key: "fabric.grey" },
  { hex: "#1d1d1f", key: "fabric.black" },
  { hex: "#1f2a44", key: "fabric.navy" },
  { hex: "#b3202a", key: "fabric.red" },
  { hex: "#264d36", key: "fabric.green" },
  { hex: "#f3c6cf", key: "fabric.pink" },
] as const;

interface PreviewSettings {
  fabric: string;
  showJumps: boolean;
  setFabric: (hex: string) => void;
  setShowJumps: (v: boolean) => void;
}

export const usePreviewSettings = create<PreviewSettings>()(
  persist(
    (set) => ({
      fabric: FABRICS[0].hex,
      showJumps: false,
      setFabric: (fabric) => set({ fabric }),
      setShowJumps: (showJumps) => set({ showJumps }),
    }),
    { name: "stichwerk-preview" },
  ),
);

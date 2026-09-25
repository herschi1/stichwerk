/**
 * Machine state for the Brother PP1.
 * Polling and error-rollback logic follow Respira (Apache-2.0); rewritten for Stichwerk.
 */

import { create } from "zustand";
import { BrotherPP1Service, BluetoothPairingError } from "./BrotherPP1Service";
import { MachineStatus, type MachineInfo, type PatternInfo, type SewingProgress } from "./types";
import { encodeStitchesToPen } from "./pen/encoder";
import { decodePenData } from "./pen/decoder";
import type { PenColorBlock } from "./pen/types";
import { ERROR_NONE, errorRollback, stateCategory } from "./errors";
import type { TranslationKey } from "../i18n";

export interface UploadedDesign {
  /** Fingerprint of the stitch list, to notice later edits. */
  key: string;
  blockColors: string[];
  /** Appliqué instructions per colour block (null = normal thread change). */
  blockNotes?: (string | null)[];
  colorBlocks: PenColorBlock[];
  totalStitches: number;
}

interface MachineState {
  supported: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  info: MachineInfo | null;
  status: MachineStatus;
  errorCode: number;
  patternInfo: PatternInfo | null;
  progress: SewingProgress | null;
  isUploading: boolean;
  uploadProgress: number;
  uploaded: UploadedDesign | null;
  /** App-side problem (connection, upload …) as translation key. */
  problem: { key: TranslationKey; detail?: string } | null;
  adjustedStitch: number | null;
  lastRolledBackError: number | null;
  pausedStitch: number | null;

  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  upload: (stitches: number[][], blockColors: string[], blockNotes?: (string | null)[]) => Promise<void>;
  startMaskTrace: () => Promise<void>;
  startSewing: () => Promise<void>;
  deletePattern: () => Promise<void>;
  stepStitch: (offset: number) => Promise<void>;
  clearProblem: () => void;
}

const service = new BrotherPP1Service();
let pollTimer: ReturnType<typeof setTimeout> | null = null;
let manualDisconnect = false;

// The design sent to the machine is remembered in the browser, so colour
// display and progress still work after the page was reloaded mid-sewing.
const UPLOADED_KEY = "stichwerk-uploaded";

function saveUploaded(u: UploadedDesign | null) {
  try {
    if (u) localStorage.setItem(UPLOADED_KEY, JSON.stringify(u));
    else localStorage.removeItem(UPLOADED_KEY);
  } catch {
    // storage not available: just no resume
  }
}

function loadUploaded(): UploadedDesign | null {
  try {
    const raw = localStorage.getItem(UPLOADED_KEY);
    return raw ? (JSON.parse(raw) as UploadedDesign) : null;
  } catch {
    return null;
  }
}

export function designKey(stitches: number[][]): string {
  let h = stitches.length;
  for (const s of stitches) h = (h * 31 + s[0] * 7 + s[1] * 13 + s[2] + s[3] * 17) | 0;
  return String(h);
}

const disconnectedState = {
  isConnected: false,
  info: null,
  status: MachineStatus.None as MachineStatus,
  errorCode: ERROR_NONE,
  patternInfo: null,
  progress: null,
  adjustedStitch: null,
  lastRolledBackError: null,
  pausedStitch: null,
};

export const useMachineStore = create<MachineState>((set, get) => {
  const run = async (key: TranslationKey, fn: () => Promise<void>) => {
    try {
      set({ problem: null });
      await fn();
    } catch (e) {
      set({ problem: { key, detail: e instanceof Error ? e.message : String(e) } });
    }
  };

  const refreshStatus = async () => {
    const s = await service.getMachineState();
    set({ status: s.status, errorCode: s.error });
  };
  const refreshProgress = async () => set({ progress: await service.getSewingProgress() });
  const refreshPatternInfo = async () => set({ patternInfo: await service.getPatternInfo() });

  const stopPolling = () => {
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = null;
  };

  const poll = async () => {
    try {
      await refreshStatus();
      const st = get();
      const category = stateCategory(st.status);
      if (st.status === MachineStatus.SEWING) await refreshProgress();
      if (category === "active" && (st.adjustedStitch !== null || st.pausedStitch !== null))
        set({ adjustedStitch: null, lastRolledBackError: null, pausedStitch: null });

      const pausedMidSew =
        category === "interrupted" ||
        (st.status === MachineStatus.SEWING_WAIT && (st.progress?.currentStitch ?? 0) > 0);
      if (pausedMidSew && get().pausedStitch === null) {
        await refreshProgress();
        // After a thread error step back a few stitches, like the Brother app does.
        const code = get().errorCode;
        const back = errorRollback(code);
        if (back !== null && code !== get().lastRolledBackError) {
          const target = Math.max(0, (get().progress?.currentStitch ?? 0) - back);
          await service.setStitchIndex(target);
          set({ adjustedStitch: target, lastRolledBackError: code });
          await refreshProgress();
        }
        set({ pausedStitch: get().adjustedStitch ?? get().progress?.currentStitch ?? 0 });
      }
    } catch {
      // a missed poll is not fatal; the next one will try again
    }
    if (!get().isConnected) return;
    const busy = ["active", "waiting"].includes(stateCategory(get().status));
    pollTimer = setTimeout(poll, busy ? 1000 : 2000);
  };

  service.onDisconnect(() => {
    stopPolling();
    set({
      ...disconnectedState,
      problem: manualDisconnect ? null : { key: "machine.err.disconnected" },
    });
    manualDisconnect = false;
  });

  return {
    supported: typeof navigator !== "undefined" && "bluetooth" in navigator,
    isConnecting: false,
    isUploading: false,
    uploadProgress: 0,
    uploaded: null,
    problem: null,
    ...disconnectedState,

    connect: async () => {
      set({ isConnecting: true, problem: null });
      try {
        await service.connect();
        set({ isConnected: true });
        const info = await service.getMachineInfo();
        set({ info });
        await refreshStatus();
        try {
          await refreshProgress();
          await refreshPatternInfo();
        } catch {
          // no pattern on the machine yet
        }
        // Same pattern still on the machine? Then pick up where we left off.
        const saved = loadUploaded();
        const onMachine = get().patternInfo?.totalStitches ?? 0;
        if (!get().uploaded && saved && onMachine > 0 && saved.totalStitches === onMachine)
          set({ uploaded: saved });
        stopPolling();
        pollTimer = setTimeout(poll, 1000);
      } catch (e) {
        // The user closed the device chooser: not an error worth showing.
        if (e instanceof DOMException && e.name === "NotFoundError") {
          set({ ...disconnectedState });
        } else {
          set({
            ...disconnectedState,
            problem:
              e instanceof BluetoothPairingError
                ? { key: "machine.err.pairing" }
                : { key: "machine.err.connect", detail: e instanceof Error ? e.message : String(e) },
          });
        }
      } finally {
        set({ isConnecting: false });
      }
    },

    disconnect: async () => {
      stopPolling();
      manualDisconnect = true;
      try {
        await service.disconnect();
      } finally {
        set({ ...disconnectedState, problem: null });
      }
    },

    upload: (stitches, blockColors, blockNotes) =>
      run("machine.err.upload", async () => {
        set({ isUploading: true, uploadProgress: 0 });
        try {
          const { penBytes, bounds } = encodeStitchesToPen(stitches);
          const pen = new Uint8Array(penBytes);
          const decoded = decodePenData(pen);
          // Our coordinates are already relative to the hoop centre, so the
          // "offset" is simply the design's own centre: the machine moves nothing.
          const centre = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
          await service.uploadPattern(pen, (p) => set({ uploadProgress: p }), bounds, centre);
          const uploaded: UploadedDesign = {
            key: designKey(stitches),
            blockColors,
            blockNotes,
            colorBlocks: decoded.colorBlocks,
            totalStitches: decoded.stitches.length,
          };
          saveUploaded(uploaded);
          set({
            uploaded,
            progress: null,
            adjustedStitch: null,
            lastRolledBackError: null,
            pausedStitch: null,
          });
          await refreshStatus();
          await refreshPatternInfo();
        } finally {
          set({ isUploading: false });
        }
      }),

    startMaskTrace: () =>
      run("machine.err.command", async () => {
        await service.startMaskTrace();
        await refreshStatus();
      }),

    startSewing: () =>
      run("machine.err.command", async () => {
        set({ adjustedStitch: null, lastRolledBackError: null, pausedStitch: null });
        await service.startSewing();
        await refreshStatus();
      }),

    deletePattern: () =>
      run("machine.err.command", async () => {
        await service.deletePattern();
        saveUploaded(null);
        set({ patternInfo: null, progress: null, uploaded: null });
        await refreshStatus();
      }),

    stepStitch: (offset) =>
      run("machine.err.command", async () => {
        const st = get();
        const total = st.patternInfo?.totalStitches ?? st.uploaded?.totalStitches ?? 0;
        const current = st.adjustedStitch ?? st.progress?.currentStitch ?? 0;
        const target = Math.max(0, Math.min(total, current + offset));
        await service.setStitchIndex(target);
        set({ adjustedStitch: target });
        await refreshProgress();
      }),

    clearProblem: () => set({ problem: null }),
  };
});

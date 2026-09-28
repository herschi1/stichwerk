/**
 * Small generic pictograms for the PP1's physical one-touch buttons.
 * These are original line-drawings (not Brother artwork) so the app can show,
 * next to each instruction, which button on the machine it is talking about.
 */

import type { ReactNode } from "react";

export type MachineButton = "startStop" | "accept" | "bluetooth" | "needle" | "thread" | "cutter";

const PATHS: Record<MachineButton, ReactNode> = {
  // Play triangle: the PP1's Start/Stop button.
  startStop: <path d="M8 6.5v11l9-5.5-9-5.5Z" fill="currentColor" stroke="none" />,
  // Checkmark: the "accept / confirm" button.
  accept: <path d="M6 12.5l4 4 8-9" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
  // Simplified Bluetooth rune (generic, not the trademarked logo glyph).
  bluetooth: (
    <path
      d="M12 5v14l5-3.8-8.5-6.2L17 5.8 12 9"
      fill="none"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  // Needle with an eye, for needle-position related steps.
  needle: (
    <g fill="none" strokeWidth="1.8" strokeLinecap="round">
      <path d="M8 18L17 9a2 2 0 0 0 0-3l0 0a2 2 0 0 0-3 0L5 15" />
      <circle cx="15.5" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
      <path d="M5 15l-1.5 3.5L7 17" />
    </g>
  ),
  // Thread spool.
  thread: (
    <g fill="none" strokeWidth="1.7" strokeLinecap="round">
      <ellipse cx="12" cy="7" rx="5" ry="2.2" />
      <ellipse cx="12" cy="17" rx="5" ry="2.2" />
      <path d="M7 7v10M17 7v10" />
      <path d="M8 8.5c3 1.5 5 1.5 8 0M8 15.5c3-1.5 5-1.5 8 0" />
    </g>
  ),
  // Scissors, for the thread cutter button.
  cutter: (
    <g fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="2.2" />
      <circle cx="7" cy="17" r="2.2" />
      <path d="M8.6 8.4 19 17M8.6 15.6 19 7" />
    </g>
  ),
};

/** A round badge icon for one PP1 button, used inline next to instructions. */
export function MachineIcon({ button, className }: { button: MachineButton; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      stroke="currentColor"
      className={className ?? "h-4 w-4 flex-shrink-0"}
      aria-hidden
    >
      {PATHS[button]}
    </svg>
  );
}

/** Icon + short label, inlined right before/after an instruction that refers to a physical button. */
export function MachineButtonTag({ button, label }: { button: MachineButton; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-denim-900 px-2 py-0.5 text-xs font-semibold text-white align-middle">
      <MachineIcon button={button} className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

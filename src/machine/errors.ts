/**
 * Brother PP1 error codes and machine-state rules, in German and English.
 * Error codes, rollback values and state rules follow Respira
 * (https://github.com/jhbruhn/respira, Apache License 2.0); texts rewritten for Stichwerk.
 */

import type { Lang } from "../i18n";
import { MachineStatus } from "./types";

export const ERROR_NONE = 0xdd;
export const ERROR_INITIAL_HOOP = 0x72;

interface Text {
  title: string;
  description: string;
  solutions: string[];
}

interface ErrorEntry {
  de: Text;
  en: Text;
  /** A normal step (homing), not a real fault. */
  informational?: boolean;
  /** Stitches to step back automatically after this error. */
  rollback?: number;
}

const ERRORS: Record<number, ErrorEntry> = {
  0x00: {
    de: {
      title: "Nadel ist unten",
      description: "Die Nadel steht unten und muss angehoben werden.",
      solutions: ["Drücke die Nadelpositionstaste, um die Nadel anzuheben."],
    },
    en: {
      title: "Needle is down",
      description: "The needle is in the down position and needs to be raised.",
      solutions: ["Press the needle position button to raise the needle."],
    },
  },
  0x01: {
    de: {
      title: "Sicherheitsabschaltung",
      description: "Die Maschine hat ein Problem im Ablauf erkannt.",
      solutions: [
        "Faden auf der Stoffoberseite entfernen, dann die Nadel herausnehmen.",
        "Faden auf der Stoffunterseite entfernen und die Spulenkapsel von allen Fadenresten befreien.",
        "Spulenkapsel auf Kratzer oder Verschmutzung prüfen.",
        "Sticknadel wieder einsetzen.",
        "Prüfen, ob die Spule richtig eingelegt ist.",
      ],
    },
    en: {
      title: "Safety stop",
      description: "The machine detected an operating problem.",
      solutions: [
        "Remove the thread on top of the fabric, then remove the needle.",
        "Remove the thread under the fabric and clean all thread from the bobbin case.",
        "Check the bobbin case for scratches or dirt.",
        "Insert the embroidery needle again.",
        "Check that the bobbin is inserted correctly.",
      ],
    },
  },
  0x02: {
    de: {
      title: "Spuler-Sicherung ausgelöst",
      description: "Die Sicherung des Spulers hat angesprochen.",
      solutions: ["Prüfen, ob sich der Faden verheddert hat."],
    },
    en: {
      title: "Bobbin winder safety",
      description: "The bobbin winder safety device was triggered.",
      solutions: ["Check whether the thread is tangled."],
    },
  },
  0x03: {
    de: {
      title: "Problem mit dem Unterfaden",
      description: "Der Spuler steht nicht in der richtigen Position.",
      solutions: ["Die Spulerwelle nach vorne schieben."],
    },
    en: {
      title: "Bobbin thread problem",
      description: "The bobbin winder is not in the correct position.",
      solutions: ["Slide the bobbin winder shaft to the front."],
    },
  },
  0x20: {
    de: {
      title: "Stichplatte",
      description: "Die Abdeckung der Stichplatte sitzt nicht richtig.",
      solutions: [
        "Die Stichplattenabdeckung wieder anbringen.",
        "Spulenkapsel prüfen (Sitz, Kratzer) und die Abdeckung erneut anbringen.",
      ],
    },
    en: {
      title: "Needle plate",
      description: "The needle plate cover is not seated correctly.",
      solutions: [
        "Reattach the needle plate cover.",
        "Check the bobbin case (position, scratches) and reattach the cover.",
      ],
    },
  },
  0x21: {
    de: {
      title: "Einfädelhebel",
      description: "Der Einfädelhebel ist nicht in seiner Ausgangsstellung.",
      solutions: ["Den Einfädelhebel in die Ausgangsstellung zurückbringen."],
    },
    en: {
      title: "Threading lever",
      description: "The needle threading lever is not in its home position.",
      solutions: ["Return the needle threading lever to its home position."],
    },
  },
  0x60: {
    rollback: 6,
    de: {
      title: "Oberfaden",
      description: "Der Oberfaden ist gerissen oder falsch eingefädelt.",
      solutions: [
        "Oberfaden prüfen und neu einfädeln.",
        "Hilft das nicht: Sticknadel tauschen und erneut einfädeln.",
        "Stichwerk ist bereits 6 Stiche zurückgegangen, damit keine Lücke entsteht.",
      ],
    },
    en: {
      title: "Upper thread",
      description: "The upper thread broke or is threaded incorrectly.",
      solutions: [
        "Check the upper thread and rethread it.",
        "If that does not help: replace the needle and rethread.",
        "Stichwerk already stepped back 6 stitches so no gap is left.",
      ],
    },
  },
  0x61: {
    rollback: 2,
    de: {
      title: "Unterfaden fast leer",
      description: "Die Spule ist fast leer.",
      solutions: [
        "Spule wechseln oder eine leere Spule richtig aufwickeln und einlegen.",
        "Stichwerk ist bereits 2 Stiche zurückgegangen.",
      ],
    },
    en: {
      title: "Bobbin almost empty",
      description: "The bobbin thread is almost used up.",
      solutions: [
        "Replace the bobbin or wind an empty one correctly and insert it.",
        "Stichwerk already stepped back 2 stitches.",
      ],
    },
  },
  0x62: {
    rollback: 21,
    de: {
      title: "Oberfaden beim Start",
      description: "Beim Stickbeginn wurde kein Oberfaden erkannt.",
      solutions: [
        "An der Maschine die Bestätigungstaste drücken.",
        "Oberfaden prüfen und neu einfädeln.",
        "Hilft das nicht: Sticknadel tauschen und erneut einfädeln.",
      ],
    },
    en: {
      title: "Upper thread at start",
      description: "No upper thread was detected when sewing started.",
      solutions: [
        "Press the accept button on the machine.",
        "Check the upper thread and rethread it.",
        "If that does not help: replace the needle and rethread.",
      ],
    },
  },
  0x63: {
    de: {
      title: "Fadenwischer",
      description: "Der Fadenwischer meldet einen Fehler.",
      solutions: ["An der Maschine die Bestätigungstaste drücken."],
    },
    en: {
      title: "Thread wiper",
      description: "The thread wiper reported an error.",
      solutions: ["Press the accept button on the machine."],
    },
  },
  0x70: {
    de: {
      title: "Falscher Stickrahmen",
      description: "Mit diesem Rahmen kann das Muster nicht gestickt werden.",
      solutions: ["Einen passenden Rahmen verwenden oder das Design verkleinern."],
    },
    en: {
      title: "Wrong hoop",
      description: "This hoop cannot be used for the pattern.",
      solutions: ["Use a hoop that fits or make the design smaller."],
    },
  },
  0x71: {
    de: {
      title: "Kein Stickrahmen",
      description: "Es ist kein Stickrahmen eingesetzt.",
      solutions: ["Den Stickrahmen einsetzen."],
    },
    en: {
      title: "No hoop",
      description: "No embroidery hoop is attached.",
      solutions: ["Attach the embroidery hoop."],
    },
  },
  [ERROR_INITIAL_HOOP]: {
    informational: true,
    de: {
      title: "Homing nötig",
      description: "Die Maschine muss einmal ihre Ausgangsposition anfahren.",
      solutions: [
        "Den Stickrahmen ganz abnehmen.",
        "An der Maschine die Bestätigungstaste drücken.",
        "Warten, bis die Maschine die Ausgangsposition angefahren hat.",
        "Den Rahmen wieder einsetzen.",
      ],
    },
    en: {
      title: "Homing required",
      description: "The machine needs to move to its home position once.",
      solutions: [
        "Remove the embroidery hoop completely.",
        "Press the accept button on the machine.",
        "Wait until the machine has finished homing.",
        "Attach the hoop again.",
      ],
    },
  },
  0x80: {
    de: {
      title: "Wartung fällig",
      description: "Die Maschine empfiehlt eine Inspektion.",
      solutions: ["Kundendienst kontaktieren."],
    },
    en: {
      title: "Maintenance due",
      description: "The machine recommends an inspection.",
      solutions: ["Contact the service centre."],
    },
  },
  0x98: {
    de: {
      title: "Einstellung nicht möglich",
      description: "Die Stichposition kann gerade nicht geändert werden.",
      solutions: ["Später erneut versuchen."],
    },
    en: {
      title: "Setting not possible",
      description: "The stitch position cannot be changed right now.",
      solutions: ["Try again later."],
    },
  },
};

// Restart errors 0x10–0x1C
for (let code = 0x10; code <= 0x1c; code++) {
  const id = code === 0x10 ? "" : ` (M5194${code.toString(16).toUpperCase().padStart(2, "0").slice(-2)})`;
  ERRORS[code] = {
    de: {
      title: `Neustart nötig${id}`,
      description: "In der Maschine ist eine Störung aufgetreten.",
      solutions: [
        "Maschine aus- und wieder einschalten.",
        ...(id ? [`Bleibt der Fehler, Code${id} notieren und den Kundendienst kontaktieren.`] : []),
      ],
    },
    en: {
      title: `Restart required${id}`,
      description: "A malfunction occurred in the machine.",
      solutions: [
        "Turn the machine off and on again.",
        ...(id ? [`If it persists, note the code${id} and contact technical support.`] : []),
      ],
    },
  };
}

export interface MachineErrorInfo extends Text {
  informational: boolean;
}

export function hasMachineError(code: number | undefined): boolean {
  return code !== undefined && code !== ERROR_NONE;
}

export function machineErrorInfo(code: number, lang: Lang): MachineErrorInfo | null {
  if (!hasMachineError(code)) return null;
  const entry = ERRORS[code];
  const hex = `0x${code.toString(16).toUpperCase().padStart(2, "0")}`;
  if (entry) return { ...entry[lang], informational: !!entry.informational };
  return lang === "de"
    ? {
        title: `Maschinenfehler ${hex}`,
        description: "Die Maschine meldet einen Fehler, den Stichwerk nicht kennt.",
        solutions: [
          "Anzeige an der Maschine und die Bedienungsanleitung prüfen.",
          "Maschine aus- und wieder einschalten.",
        ],
        informational: false,
      }
    : {
        title: `Machine error ${hex}`,
        description: "The machine reported an error that Stichwerk does not know.",
        solutions: ["Check the machine display and the manual.", "Turn the machine off and on again."],
        informational: false,
      };
}

export function errorRollback(code: number): number | null {
  return ERRORS[code]?.rollback ?? null;
}

// ---- State rules ----

export type StateCategory = "idle" | "active" | "waiting" | "complete" | "interrupted" | "unknown";

export function stateCategory(status: MachineStatus): StateCategory {
  switch (status) {
    case MachineStatus.IDLE:
    case MachineStatus.SEWING_WAIT:
    case MachineStatus.Initial:
    case MachineStatus.LowerThread:
      return "idle";
    case MachineStatus.SEWING:
    case MachineStatus.MASK_TRACING:
    case MachineStatus.SEWING_DATA_RECEIVE:
    case MachineStatus.HOOP_AVOIDANCEING:
      return "active";
    case MachineStatus.COLOR_CHANGE_WAIT:
    case MachineStatus.MASK_TRACE_LOCK_WAIT:
    case MachineStatus.HOOP_AVOIDANCE:
      return "waiting";
    case MachineStatus.SEWING_COMPLETE:
    case MachineStatus.MASK_TRACE_COMPLETE:
    case MachineStatus.RL_RECEIVED:
      return "complete";
    case MachineStatus.PAUSE:
    case MachineStatus.STOP:
    case MachineStatus.SEWING_INTERRUPTION:
      return "interrupted";
    default:
      return "unknown";
  }
}

export const canUpload = (s: MachineStatus) => ["idle", "complete"].includes(stateCategory(s));
export const canDelete = (s: MachineStatus) =>
  ["idle", "waiting", "complete"].includes(stateCategory(s));
export const canMaskTrace = (s: MachineStatus, hasProgress: boolean) =>
  s === MachineStatus.IDLE ||
  s === MachineStatus.MASK_TRACE_COMPLETE ||
  (s === MachineStatus.SEWING_WAIT && !hasProgress);
export const canStartSewing = (s: MachineStatus) =>
  s === MachineStatus.MASK_TRACE_COMPLETE ||
  s === MachineStatus.PAUSE ||
  s === MachineStatus.SEWING_INTERRUPTION;
export const canResume = (s: MachineStatus) =>
  s === MachineStatus.PAUSE || s === MachineStatus.SEWING_INTERRUPTION;
export const canStepStitches = (s: MachineStatus, hasProgress: boolean) =>
  s === MachineStatus.PAUSE ||
  s === MachineStatus.STOP ||
  s === MachineStatus.SEWING_INTERRUPTION ||
  (s === MachineStatus.SEWING_WAIT && hasProgress);

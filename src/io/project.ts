/** Saving and loading designs as JSON files. */

import type { DesignElement } from "../designer/types";
import { FABRIC_PROFILES, type FabricProfileId } from "../engine/profiles";

const FORMAT = "stichwerk-design";
const VERSION = 1;

export function serializeDesign(elements: DesignElement[], fabric: FabricProfileId): string {
  return JSON.stringify({ format: FORMAT, version: VERSION, fabric, elements }, null, 1);
}

export interface LoadedDesign {
  elements: DesignElement[];
  fabric?: FabricProfileId;
}

export class ProjectFormatError extends Error {}

export function parseDesign(text: string): LoadedDesign {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ProjectFormatError();
  }
  const d = data as { format?: string; elements?: unknown; fabric?: string };
  if (d.format !== FORMAT || !Array.isArray(d.elements)) throw new ProjectFormatError();
  const elements = (d.elements as DesignElement[]).filter(
    (e) => e && typeof e.id === "string" && ["text", "shape", "svg"].includes(e.kind),
  );
  const fabric = d.fabric && d.fabric in FABRIC_PROFILES ? (d.fabric as FabricProfileId) : undefined;
  return { elements, fabric };
}

export function downloadFile(data: BlobPart, fileName: string, mime: string) {
  const url = URL.createObjectURL(new Blob([data], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Opens the browser's file picker and resolves with the chosen file. */
export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}

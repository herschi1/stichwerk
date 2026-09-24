/** Saving and loading designs as JSON files. */

import type { DesignElement } from "../designer/types";

const FORMAT = "stichwerk-design";
const VERSION = 1;

export function serializeDesign(elements: DesignElement[]): string {
  return JSON.stringify({ format: FORMAT, version: VERSION, elements }, null, 1);
}

export class ProjectFormatError extends Error {}

export function parseDesign(text: string): DesignElement[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ProjectFormatError();
  }
  const d = data as { format?: string; elements?: unknown };
  if (d.format !== FORMAT || !Array.isArray(d.elements)) throw new ProjectFormatError();
  return (d.elements as DesignElement[]).filter(
    (e) => e && typeof e.id === "string" && ["text", "shape", "svg"].includes(e.kind),
  );
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

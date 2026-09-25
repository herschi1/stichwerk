import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useT } from "./i18n";
import { useDesignStore } from "./designer/useDesignStore";
import { useGeneratedDesign } from "./designer/useGeneratedDesign";
import { FontLoadError } from "./designer/fonts";
import { importSvg } from "./io/svg";
import { writePes } from "./io/pes";
import { downloadFile, parseDesign, pickFile, serializeDesign } from "./io/project";
import { Header } from "./ui/Header";
import { ElementPanel } from "./ui/ElementPanel";
import { Preview } from "./ui/Preview";
import { InfoPanels } from "./ui/InfoPanels";
import { InfoDialog } from "./ui/InfoDialog";
import { DEFAULT_HOOP_MM } from "./ui/Preview";
import { designKey, useMachineStore } from "./machine/useMachineStore";
import { MachineStatus } from "./machine/types";

export function App() {
  const t = useT();
  const elements = useDesignStore((s) => s.elements);
  const replaceAll = useDesignStore((s) => s.replaceAll);
  const addSvg = useDesignStore((s) => s.addSvg);
  const { selectedId, select, update, moveAll, remove, duplicate, undo, redo } = useDesignStore(
    useShallow((s) => ({
      selectedId: s.selectedId,
      select: s.select,
      update: s.update,
      moveAll: s.moveAll,
      remove: s.remove,
      duplicate: s.duplicate,
      undo: s.undo,
      redo: s.redo,
    })),
  );
  const fabric = useDesignStore((s) => s.fabric);
  const { design, error: genError } = useGeneratedDesign(elements, fabric);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Hoop size: reported by the machine once connected (0.1 mm units), else 100 × 100 mm.
  const info = useMachineStore((s) => s.info);
  const hoopW = info?.maxWidth ? info.maxWidth / 10 : DEFAULT_HOOP_MM;
  const hoopH = info?.maxHeight ? info.maxHeight / 10 : DEFAULT_HOOP_MM;
  const hoop = useMemo(() => ({ w: hoopW, h: hoopH }), [hoopW, hoopH]);
  const fitsHoop = design.stitches.every(
    ([x, y]) => Math.abs(x) <= hoop.w * 5 && Math.abs(y) <= hoop.h * 5,
  );

  // Fade the not-yet-sewn part of the preview while the machine works on this design.
  const machine = useMachineStore(
    useShallow((s) => ({
      uploaded: s.uploaded,
      progress: s.progress,
      adjusted: s.adjustedStitch,
      status: s.status,
    })),
  );
  const sewingThis =
    !!machine.uploaded &&
    machine.uploaded.key === designKey(design.stitches) &&
    machine.status !== MachineStatus.SEWING_COMPLETE &&
    (machine.adjusted ?? machine.progress?.currentStitch ?? 0) > 0;
  const sewnFraction = sewingThis
    ? (machine.adjusted ?? machine.progress?.currentStitch ?? 0) / (machine.uploaded!.totalStitches || 1)
    : null;

  const shownError =
    error ??
    (genError
      ? genError instanceof FontLoadError
        ? t("error.fontLoad")
        : t("error.generic", { msg: String((genError as Error).message ?? genError) })
      : null);

  // Keyboard shortcuts (not while typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable=true]")) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && (key === "y" || (key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (mod && key === "d" && selectedId) {
        e.preventDefault();
        duplicate(selectedId);
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        remove(selectedId);
      } else if (e.key === "Escape") {
        select(null);
      } else if (e.key.startsWith("Arrow") && selectedId) {
        const el2 = useDesignStore.getState().elements.find((x) => x.id === selectedId);
        if (!el2) return;
        e.preventDefault();
        const step = e.shiftKey ? 5 : e.altKey ? 0.1 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        update(
          selectedId,
          { x: Math.round((el2.x + dx) * 10) / 10, y: Math.round((el2.y + dy) * 10) / 10 },
          `nudge:${selectedId}`,
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, undo, redo, duplicate, remove, select, update]);

  const onCenterDesign = () => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [x, y, cmd] of design.stitches) {
      if (cmd & 0x10) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    if (isFinite(minX)) moveAll(-(minX + maxX) / 20, -(minY + maxY) / 20);
  };

  const onNew = () => {
    if (elements.length === 0 || window.confirm(t("toolbar.confirmNew"))) replaceAll([]);
  };

  const onOpen = async () => {
    const file = await pickFile(".json,application/json");
    if (!file) return;
    try {
      const loaded = parseDesign(await file.text());
      replaceAll(loaded.elements, loaded.fabric);
      setError(null);
    } catch {
      setError(t("error.projectInvalid"));
    }
  };

  const onSave = () => downloadFile(serializeDesign(elements, fabric), "stichwerk-design.json", "application/json");

  const onImportSvg = async () => {
    const file = await pickFile(".svg,image/svg+xml");
    if (!file) return;
    try {
      addSvg(importSvg(await file.text()), file.name.replace(/\.svg$/i, ""));
      setError(null);
    } catch (e) {
      setError((e as Error).message === "svg-empty" ? t("error.svgEmpty") : t("error.svgInvalid"));
    }
  };

  const onExportPes = () =>
    downloadFile(writePes(design.stitches, design.blockColors, "Stichwerk"), "stichwerk.pes", "application/octet-stream");

  return (
    <div className="flex h-full flex-col">
      <Header
        onNew={onNew}
        onOpen={onOpen}
        onSave={onSave}
        onImportSvg={onImportSvg}
        onExportPes={onExportPes}
        canExport={design.stitches.length > 1}
        onInfo={() => setShowInfo(true)}
      />
      {shownError && (
        <div role="alert" className="flex items-start gap-3 bg-thread-100 px-5 py-2 text-sm text-denim-950">
          <span className="flex-1">{shownError}</span>
          {error && (
            <button type="button" className="font-semibold underline" onClick={() => setError(null)}>
              OK
            </button>
          )}
        </div>
      )}
      {showInfo && <InfoDialog onClose={() => setShowInfo(false)} />}
      <main className="grid flex-1 gap-4 overflow-auto p-4 lg:grid-cols-[360px_1fr_280px] lg:overflow-hidden">
        <div className="lg:overflow-y-auto lg:pr-1">
          <ElementPanel onError={setError} design={design} />
        </div>
        <Preview
          design={design}
          hoop={hoop}
          sewnFraction={sewnFraction}
          fitsHoop={fitsHoop}
          elements={elements}
          selectedId={selectedId}
          onSelect={select}
          onEdit={update}
          onCenterDesign={onCenterDesign}
        />
        <div className="flex flex-col gap-4 lg:overflow-y-auto">
          <InfoPanels design={design} fitsHoop={fitsHoop} />
          <p className="px-1 text-xs text-denim-500">
            {t("footer.credits")}{" "}
            <button type="button" onClick={() => setShowInfo(true)} className="font-medium text-denim-700 underline">
              {t("info.open")}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

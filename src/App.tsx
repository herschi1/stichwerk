import { useMemo, useState } from "react";
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
import { DEFAULT_HOOP_MM } from "./ui/Preview";
import { designKey, useMachineStore } from "./machine/useMachineStore";
import { MachineStatus } from "./machine/types";

export function App() {
  const t = useT();
  const elements = useDesignStore((s) => s.elements);
  const replaceAll = useDesignStore((s) => s.replaceAll);
  const addSvg = useDesignStore((s) => s.addSvg);
  const { design, error: genError } = useGeneratedDesign(elements);
  const [error, setError] = useState<string | null>(null);

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

  const onNew = () => {
    if (elements.length === 0 || window.confirm(t("toolbar.confirmNew"))) replaceAll([]);
  };

  const onOpen = async () => {
    const file = await pickFile(".json,application/json");
    if (!file) return;
    try {
      replaceAll(parseDesign(await file.text()));
      setError(null);
    } catch {
      setError(t("error.projectInvalid"));
    }
  };

  const onSave = () => downloadFile(serializeDesign(elements), "stichwerk-design.json", "application/json");

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
      <main className="grid flex-1 gap-4 overflow-auto p-4 lg:grid-cols-[360px_1fr_280px] lg:overflow-hidden">
        <div className="lg:overflow-y-auto lg:pr-1">
          <ElementPanel onError={setError} />
        </div>
        <Preview design={design} hoop={hoop} sewnFraction={sewnFraction} fitsHoop={fitsHoop} />
        <div className="flex flex-col gap-4 lg:overflow-y-auto">
          <InfoPanels design={design} fitsHoop={fitsHoop} />
          <p className="px-1 text-xs text-denim-500">{t("footer.credits")}</p>
        </div>
      </main>
    </div>
  );
}

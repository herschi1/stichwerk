import { useLang, useT, type Lang } from "../i18n";
import { ToolButton } from "./fields";

interface Props {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onImportSvg: () => void;
  onExportPes: () => void;
  canExport: boolean;
  onInfo: () => void;
}

export function Header({ onNew, onOpen, onSave, onImportSvg, onExportPes, canExport, onInfo }: Props) {
  const t = useT();
  const { lang, setLang } = useLang();
  return (
    <header className="bg-denim-900 text-white">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-2xl tracking-tight">Stichwerk</span>
          <span className="text-xs tabular-nums text-denim-200" title={t("info.version", { v: __APP_VERSION__ })}>
            v{__APP_VERSION__}
          </span>
          <span className="hidden text-sm text-denim-200 md:inline">{t("app.tagline")}</span>
        </div>
        <nav className="flex flex-1 flex-wrap items-center gap-1">
          <ToolButton onClick={onNew}>{t("toolbar.new")}</ToolButton>
          <ToolButton onClick={onOpen}>{t("toolbar.open")}</ToolButton>
          <ToolButton onClick={onSave}>{t("toolbar.save")}</ToolButton>
          <span className="mx-2 h-5 w-px bg-denim-700" aria-hidden />
          <ToolButton onClick={onImportSvg}>{t("toolbar.importSvg")}</ToolButton>
          <ToolButton primary onClick={onExportPes} disabled={!canExport}>
            {t("toolbar.exportPes")}
          </ToolButton>
        </nav>
        <button type="button" onClick={onInfo} className="text-sm text-denim-200 underline-offset-2 hover:text-white hover:underline">
          {t("info.open")}
        </button>
        <div className="flex overflow-hidden rounded-md ring-1 ring-denim-700" role="group" aria-label={t("lang.switch")}>
          {(["de", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={
                "px-2.5 py-1 text-xs font-semibold uppercase " +
                (lang === l ? "bg-denim-100 text-denim-900" : "text-denim-200 hover:bg-denim-700")
              }
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="topstitch mx-5 mb-2" aria-hidden />
    </header>
  );
}

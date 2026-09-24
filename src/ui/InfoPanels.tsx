import type { GeneratedDesign } from "../engine/compose";
import { useLang, useT } from "../i18n";
import { colorLabel } from "../designer/palette";
import { Panel } from "./fields";
import { MachinePanel } from "./MachinePanel";

/** Rough sewing time: the PP1 sews around 400 stitches per minute incl. overhead. */
const STITCHES_PER_MINUTE = 400;

export function InfoPanels({ design, fitsHoop }: { design: GeneratedDesign; fitsHoop: boolean }) {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const count = design.stitches.length;
  const fmt = (n: number, digits = 0) =>
    n.toLocaleString(lang === "de" ? "de-AT" : "en-GB", { maximumFractionDigits: digits });

  return (
    <div className="flex flex-col gap-4">
      <MachinePanel design={design} fitsHoop={fitsHoop} />
      {count > 0 && (
        <Panel>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dd className="font-display text-base text-denim-900">{t("stats.stitches", { n: fmt(count) })}</dd>
            <dd className="font-display text-base text-denim-900">
              {design.blockColors.length === 1
                ? t("stats.color")
                : t("stats.colors", { n: design.blockColors.length })}
            </dd>
            <dd className="text-denim-700">
              {t("stats.size", { w: fmt(design.width, 1), h: fmt(design.height, 1) })}
            </dd>
            <dd className="text-denim-700">
              {t("stats.time", { n: Math.max(1, Math.round(count / STITCHES_PER_MINUTE)) })}
            </dd>
          </dl>
        </Panel>
      )}

      {design.blockColors.length > 0 && (
        <Panel title={t("sequence.title")}>
          <ol className="flex flex-col gap-1.5 text-sm">
            {design.blockColors.map((hex, i) => {
              return (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-5 text-right tabular-nums text-denim-500">{i + 1}</span>
                  <span className="h-4 w-4 rounded-full ring-1 ring-denim-200" style={{ background: hex }} />
                  <span>{colorLabel(hex)}</span>
                </li>
              );
            })}
          </ol>
        </Panel>
      )}

    </div>
  );
}

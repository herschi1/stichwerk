import { useShallow } from "zustand/react/shallow";
import { useT, type TranslationKey } from "../i18n";
import type { GeneratedDesign } from "../engine/compose";
import { MOVE } from "../engine/constants";
import { PLACEMENTS, type PlacementId } from "../designer/placements";
import { useDesignStore } from "../designer/useDesignStore";
import { Panel, inputClass } from "./fields";

/** Shirt templates: fit the design to a typical position and explain where to hoop. */
export function PlacementPanel({ design }: { design: GeneratedDesign }) {
  const t = useT();
  const { placement, setPlacement, scaleDesign } = useDesignStore(
    useShallow((s) => ({ placement: s.placement, setPlacement: s.setPlacement, scaleDesign: s.scaleDesign })),
  );
  const current = PLACEMENTS.find((p) => p.id === placement) ?? null;

  const fit = () => {
    if (!current || design.width <= 0 || design.height <= 0) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [x, y, cmd] of design.stitches) {
      if (cmd & MOVE) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    const f = Math.min(current.w / design.width, current.h / design.height);
    scaleDesign(f, (minX + maxX) / 20, (minY + maxY) / 20);
  };

  return (
    <Panel title={t("placement.title")} help="help.placement">
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <select
          className={inputClass}
          aria-label={t("placement.title")}
          value={placement ?? ""}
          onChange={(e) => setPlacement((e.target.value || null) as PlacementId | null)}
        >
          <option value="">{t("placement.none")}</option>
          {PLACEMENTS.map((p) => (
            <option key={p.id} value={p.id}>
              {t(`placement.${p.id}` as TranslationKey)} ({t("placement.max", { w: p.w / 10, h: p.h / 10 })})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={fit}
          disabled={!current || design.stitches.length === 0}
          className="rounded-md bg-denim-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-denim-700 disabled:opacity-40"
        >
          {t("placement.fit")}
        </button>
      </div>
      {current && (
        <p className="mt-2 rounded-md bg-denim-50 px-2 py-1.5 text-xs leading-relaxed text-denim-900">
          {t(`placement.${current.id}.how` as TranslationKey)}
        </p>
      )}
    </Panel>
  );
}

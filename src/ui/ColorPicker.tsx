import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useT } from "../i18n";
import {
  PALETTES,
  paletteById,
  threadById,
  threadInfo,
  threadLabel,
  useThreadStore,
  type PaletteView,
  type ThreadColor,
} from "../designer/palette";
import { inputClass } from "./fields";

/** Thread colour picker: Madeira / Brother ranges, search, and "my threads". */
export function ColorPicker({ value, onPick }: { value: string; onPick: (hex: string) => void }) {
  const t = useT();
  const { view, mine, setView, toggleMine } = useThreadStore(
    useShallow((s) => ({ view: s.view, mine: s.mine, setView: s.setView, toggleMine: s.toggleMine })),
  );
  const [query, setQuery] = useState("");

  const colors: ThreadColor[] = useMemo(() => {
    const list =
      view === "mine"
        ? mine.map((id) => threadById(id)).filter((c): c is ThreadColor => !!c)
        : paletteById(view).colors;
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => c.code.toLowerCase().startsWith(q) || c.name.toLowerCase().includes(q));
  }, [view, mine, query]);

  const selected = threadInfo(value);
  const isMine = selected ? mine.includes(selected.id) : false;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <select
          className={inputClass}
          value={view}
          aria-label={t("threads.range")}
          onChange={(e) => setView(e.target.value as PaletteView)}
        >
          <option value="mine">{t("threads.mine", { n: mine.length })}</option>
          {PALETTES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({p.colors.length})
            </option>
          ))}
        </select>
        <input
          type="search"
          className={inputClass + " w-28"}
          placeholder={t("threads.search")}
          aria-label={t("threads.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {view === "mine" && mine.length === 0 ? (
        <p className="rounded-md bg-denim-50 px-2 py-2 text-xs text-denim-900">{t("threads.mineEmpty")}</p>
      ) : colors.length === 0 ? (
        <p className="px-1 text-xs text-denim-700">{t("threads.noResults")}</p>
      ) : (
        <div className="grid max-h-44 grid-cols-12 gap-1 overflow-y-auto pr-1">
          {colors.map((c) => (
            <button
              key={c.id}
              type="button"
              title={threadLabel(c)}
              aria-label={threadLabel(c)}
              aria-pressed={value === c.hex}
              onClick={() => onPick(c.hex)}
              className={
                "relative aspect-square rounded-sm ring-1 " +
                (value === c.hex ? "ring-2 ring-thread-500 ring-offset-1" : "ring-denim-200")
              }
              style={{ background: c.hex }}
            >
              {view !== "mine" && mine.includes(c.id) && (
                <span className="absolute -right-0.5 -top-1 text-[9px] text-thread-600" aria-hidden>
                  ★
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="flex items-center gap-2 text-xs text-denim-900">
          <span className="h-4 w-4 flex-shrink-0 rounded-sm ring-1 ring-denim-200" style={{ background: selected.hex }} />
          <span className="min-w-0 flex-1 truncate">
            {paletteById(selected.palette).short} {selected.code} · {selected.name}
          </span>
          <button
            type="button"
            onClick={() => toggleMine(selected.id)}
            aria-pressed={isMine}
            className="flex-shrink-0 rounded px-1.5 py-0.5 font-medium text-denim-900 ring-1 ring-denim-200 hover:bg-denim-50"
          >
            {isMine ? t("threads.inMine") : t("threads.addMine")}
          </button>
        </div>
      )}
    </div>
  );
}

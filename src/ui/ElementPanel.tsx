import { useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useT, type TFunction, type TranslationKey } from "../i18n";
import { useDesignStore } from "../designer/useDesignStore";
import { DEFAULT_FONT_ID, fontInfo, isFontAvailable, registerCustomFont } from "../designer/fonts";
import { FontPicker } from "./FontPicker";
import { ColorPicker } from "./ColorPicker";
import type { DesignElement, ShapeKind, StitchMode } from "../designer/types";
import { Field, Group, NumField, Panel, inputClass } from "./fields";
import { FABRIC_PROFILES, type FabricProfileId } from "../engine/profiles";

const SHAPES: ShapeKind[] = ["heart", "circle", "rect", "star"];
const MODES: StitchMode[] = ["satin", "fill", "fill-satin", "fill-outline", "outline"];
const FABRIC_IDS: FabricProfileId[] = ["jersey", "woven", "canvas"];

function elementLabel(el: DesignElement, t: TFunction): string {
  if (el.kind === "text")
    return t("label.text", { text: el.text.split("\n")[0] || t("label.emptyText") });
  if (el.kind === "svg") return t("label.svg", { name: el.name });
  return t(`shape.${el.shape}` as TranslationKey);
}

export function ElementPanel({ onError }: { onError: (msg: string) => void }) {
  const t = useT();
  const { elements, selectedId, addText, addShape, update, remove, moveInOrder, select, fabric, setFabric } =
    useDesignStore(
      useShallow((s) => ({
        fabric: s.fabric,
        setFabric: s.setFabric,
        elements: s.elements,
        selectedId: s.selectedId,
        addText: s.addText,
        addShape: s.addShape,
        update: s.update,
        remove: s.remove,
        moveInOrder: s.moveInOrder,
        select: s.select,
      })),
    );
  const fontInput = useRef<HTMLInputElement>(null);
  const selected = elements.find((e) => e.id === selectedId) ?? null;

  const handleFontFile = async (file: File | undefined) => {
    if (!file || !selected || selected.kind !== "text") return;
    try {
      const info = await registerCustomFont(file);
      update(selected.id, { fontId: info.id });
    } catch {
      onError(t("error.font"));
    }
  };

  // Each font has a minimum height below which satin/fill gets messy.
  const minHeight =
    selected?.kind === "text"
      ? selected.mode === "satin"
        ? fontInfo(selected.fontId).minHeight
        : Math.max(7, fontInfo(selected.fontId).minHeight)
      : 0;
  const smallText =
    selected?.kind === "text" && selected.mode !== "outline" && selected.height < minHeight;
  const isSatin = selected?.mode === "satin";

  const changeMode = (el: DesignElement, mode: StitchMode) => {
    // satin wants denser rows than a fill
    let density = el.density;
    if (mode === "satin" && el.mode !== "satin") density = FABRIC_PROFILES[fabric].satinSpacing;
    if (mode !== "satin" && el.mode === "satin") density = 0.4;
    update(el.id, { mode, density });
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel title={t("fabricProfile.title")}>
        <select
          className={inputClass}
          value={fabric}
          onChange={(e) => setFabric(e.target.value as FabricProfileId)}
          aria-label={t("fabricProfile.title")}
        >
          {FABRIC_IDS.map((f) => (
            <option key={f} value={f}>
              {t(`fabricProfile.${f}` as TranslationKey)}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-denim-700">{t(`fabricProfile.hint.${fabric}` as TranslationKey)}</p>
      </Panel>

      <Panel title={t("elements.title")}>
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={addText}
            className="flex-1 rounded-md bg-denim-900 px-3 py-2 text-sm font-medium text-white hover:bg-denim-700"
          >
            {t("elements.addText")}
          </button>
          <button
            type="button"
            onClick={addShape}
            className="flex-1 rounded-md bg-denim-900 px-3 py-2 text-sm font-medium text-white hover:bg-denim-700"
          >
            {t("elements.addShape")}
          </button>
        </div>

        {elements.length === 0 ? (
          <p className="text-sm text-denim-700">{t("elements.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {elements.map((el, i) => (
              <li key={el.id}>
                <div
                  className={
                    "flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm " +
                    (el.id === selectedId
                      ? "border-thread-500 bg-thread-100"
                      : "border-transparent hover:bg-denim-50")
                  }
                >
                  <button
                    type="button"
                    onClick={() => select(el.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span
                      className="h-3.5 w-3.5 flex-shrink-0 rounded-sm ring-1 ring-denim-200"
                      style={{
                        background:
                          el.kind === "svg" && !el.singleColor
                            ? `conic-gradient(${[...new Set(el.parts.map((p) => p.color))].slice(0, 4).join(",")})`
                            : el.color,
                      }}
                    />
                    <span className="truncate">{elementLabel(el, t)}</span>
                  </button>
                  <IconButton label={t("elements.earlier")} disabled={i === 0} onClick={() => moveInOrder(el.id, -1)}>
                    ↑
                  </IconButton>
                  <IconButton
                    label={t("elements.later")}
                    disabled={i === elements.length - 1}
                    onClick={() => moveInOrder(el.id, 1)}
                  >
                    ↓
                  </IconButton>
                  <IconButton label={t("elements.delete")} onClick={() => remove(el.id)}>
                    ×
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>
        )}
        {elements.length > 1 && <p className="mt-3 text-xs text-denim-700">{t("elements.orderHint")}</p>}
      </Panel>

      {selected && (
        <Panel title={elementLabel(selected, t)}>
          <div className="flex flex-col gap-3">
            {selected.kind === "text" && (
              <>
                <Field label={t("edit.text")}>
                  <textarea
                    className={inputClass + " min-h-16 font-medium"}
                    value={selected.text}
                    onChange={(e) => update(selected.id, { text: e.target.value })}
                  />
                </Field>
                <Group label={t("edit.font")}>
                  <FontPicker
                    value={isFontAvailable(selected.fontId) ? selected.fontId : DEFAULT_FONT_ID}
                    sample={selected.text}
                    onChange={(id) => update(selected.id, { fontId: id })}
                    onUpload={() => fontInput.current?.click()}
                  />
                  <input
                    ref={fontInput}
                    type="file"
                    accept=".ttf,.otf,.woff"
                    className="hidden"
                    onChange={(e) => {
                      handleFontFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </Group>
                <div className="grid grid-cols-3 gap-2">
                  <NumField
                    label={t("edit.letterHeight")}
                    value={selected.height}
                    step={0.5}
                    min={3}
                    max={90}
                    onChange={(v) => update(selected.id, { height: v })}
                  />
                  <NumField
                    label={t("edit.letterSpacing")}
                    value={selected.letterSpacing}
                    step={0.1}
                    onChange={(v) => update(selected.id, { letterSpacing: v })}
                  />
                  <NumField
                    label={t("edit.lineSpacing")}
                    value={selected.lineSpacing}
                    step={0.1}
                    min={0.8}
                    onChange={(v) => update(selected.id, { lineSpacing: v })}
                  />
                </div>
              </>
            )}

            {selected.kind === "shape" && (
              <>
                <Field label={t("edit.shape")}>
                  <select
                    className={inputClass}
                    value={selected.shape}
                    onChange={(e) => update(selected.id, { shape: e.target.value as ShapeKind })}
                  >
                    {SHAPES.map((s) => (
                      <option key={s} value={s}>
                        {t(`shape.${s}` as TranslationKey)}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <NumField
                    label={t("edit.width")}
                    value={selected.width}
                    min={3}
                    max={100}
                    onChange={(v) => update(selected.id, { width: v })}
                  />
                  <NumField
                    label={t("edit.height")}
                    value={selected.height}
                    min={3}
                    max={100}
                    onChange={(v) => update(selected.id, { height: v })}
                  />
                </div>
              </>
            )}

            {selected.kind === "svg" && (
              <div className="grid grid-cols-2 gap-2">
                <NumField
                  label={t("edit.width")}
                  value={selected.width}
                  min={5}
                  max={100}
                  onChange={(v) => update(selected.id, { width: v })}
                />
                <NumField
                  label={t("edit.height")}
                  value={(selected.width * selected.sourceHeight) / (selected.sourceWidth || 1)}
                  min={5}
                  max={100}
                  onChange={(v) =>
                    update(selected.id, {
                      width: (v * selected.sourceWidth) / (selected.sourceHeight || 1),
                    })
                  }
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <NumField
                label={t("edit.posX")}
                value={selected.x}
                step={0.5}
                onChange={(v) => update(selected.id, { x: v })}
              />
              <NumField
                label={t("edit.posY")}
                value={selected.y}
                step={0.5}
                onChange={(v) => update(selected.id, { y: v })}
              />
            </div>

            <Field label={t("edit.mode")}>
              <select
                className={inputClass}
                value={selected.mode}
                onChange={(e) => changeMode(selected, e.target.value as StitchMode)}
              >
                {MODES.map((m) => (
                  <option key={m} value={m}>
                    {t(`mode.${m}` as TranslationKey)}
                  </option>
                ))}
              </select>
            </Field>

            {isSatin && <p className="text-xs text-denim-700">{t("edit.satinHint")}</p>}

            {selected.mode !== "outline" && (
              <div className="grid grid-cols-3 items-end gap-2">
                {!isSatin && (
                  <NumField
                    label={t("edit.angle")}
                    value={selected.angle}
                    step={15}
                    onChange={(v) => update(selected.id, { angle: v })}
                  />
                )}
                <NumField
                  label={isSatin ? t("edit.satinSpacing") : t("edit.density")}
                  value={selected.density}
                  step={0.05}
                  min={isSatin ? 0.2 : 0.3}
                  max={1}
                  onChange={(v) => update(selected.id, { density: Math.max(isSatin ? 0.2 : 0.3, v) })}
                />
                {selected.mode === "fill-satin" && (
                  <NumField
                    label={t("edit.borderWidth")}
                    value={selected.borderWidth ?? 2}
                    step={0.5}
                    min={1}
                    max={6}
                    onChange={(v) => update(selected.id, { borderWidth: Math.min(6, Math.max(1, v)) })}
                  />
                )}
                <label className="flex items-center gap-2 pb-2 text-xs font-medium text-denim-700">
                  <input
                    type="checkbox"
                    className="accent-thread-500"
                    checked={selected.underlay}
                    onChange={(e) => update(selected.id, { underlay: e.target.checked })}
                  />
                  {t("edit.underlay")}
                </label>
              </div>
            )}

            {smallText && (
              <p className="rounded-md bg-thread-100 px-2 py-1.5 text-xs text-denim-900">
                {t("edit.fontMinHeight", { n: minHeight })}
              </p>
            )}

            {selected.kind === "svg" && (
              <Field label={t("svg.colors")}>
                <select
                  className={inputClass}
                  value={selected.singleColor ? "single" : "file"}
                  onChange={(e) => update(selected.id, { singleColor: e.target.value === "single" })}
                >
                  <option value="file">{t("svg.fileColors")}</option>
                  <option value="single">{t("svg.singleColor")}</option>
                </select>
              </Field>
            )}

            {selected.kind === "svg" && !selected.singleColor && (
              <SvgColorEditor
                colors={[...new Set(selected.parts.map((p) => p.color))]}
                label={t("svg.replaceColor")}
                onReplace={(from, to) =>
                  update(selected.id, {
                    parts: selected.parts.map((p) => (p.color === from ? { ...p, color: to } : p)),
                  })
                }
              />
            )}

            {(selected.kind !== "svg" || selected.singleColor) && (
              <Group label={t("edit.color")}>
                <ColorPicker value={selected.color} onPick={(hex) => update(selected.id, { color: hex })} />
              </Group>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}

function SvgColorEditor({
  colors,
  label,
  onReplace,
}: {
  colors: string[];
  label: string;
  onReplace: (from: string, to: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <Group label={label}>
      <div className="flex flex-wrap gap-1.5">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={editing === c}
            onClick={() => setEditing(editing === c ? null : c)}
            className={
              "h-7 w-7 rounded-full ring-1 " +
              (editing === c ? "ring-2 ring-thread-500 ring-offset-2" : "ring-denim-200")
            }
            style={{ background: c }}
          />
        ))}
      </div>
      {editing && (
        <div className="mt-2">
          <ColorPicker
            value={editing}
            onPick={(hex) => {
              onReplace(editing, hex);
              setEditing(hex);
            }}
          />
        </div>
      )}
    </Group>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="h-6 w-6 rounded text-base leading-none text-denim-500 hover:bg-denim-100 hover:text-denim-900 disabled:opacity-25"
    >
      {children}
    </button>
  );
}

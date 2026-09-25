import { useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useT, type TFunction, type TranslationKey } from "../i18n";
import { useDesignStore } from "../designer/useDesignStore";
import { DEFAULT_FONT_ID, fontInfo, isFontAvailable, registerCustomFont } from "../designer/fonts";
import { FontPicker } from "./FontPicker";
import { ColorPicker } from "./ColorPicker";
import { nearestThread } from "../designer/palette";
import type { DesignElement, MonogramFrame, ShapeKind, StitchMode, TextAlign, TextArc } from "../designer/types";
import { Field, Group, NumField, Panel, inputClass } from "./fields";
import { HelpButton } from "./HelpButton";
import { PlacementPanel } from "./PlacementPanel";
import type { GeneratedDesign } from "../engine/compose";
import { FABRIC_PROFILES, type FabricProfileId } from "../engine/profiles";

const SHAPES: ShapeKind[] = ["heart", "circle", "rect", "star", "diamond"];
const MODES: StitchMode[] = ["satin", "fill", "fill-satin", "fill-outline", "outline", "applique"];
const FRAMES: MonogramFrame[] = ["none", "circle", "diamond", "rect"];
const FABRIC_IDS: FabricProfileId[] = ["jersey", "woven", "canvas"];

function elementLabel(el: DesignElement, t: TFunction): string {
  if (el.kind === "text")
    return t("label.text", { text: el.text.split("\n")[0] || t("label.emptyText") });
  if (el.kind === "svg") return t("label.svg", { name: el.name });
  if (el.kind === "monogram") return t("label.monogram", { letters: el.letters || "–" });
  return t(`shape.${el.shape}` as TranslationKey);
}

export function ElementPanel({ onError, design }: { onError: (msg: string) => void; design: GeneratedDesign }) {
  const t = useT();
  const {
    elements,
    selectedId,
    addText,
    addShape,
    addMonogram,
    update,
    remove,
    moveInOrder,
    select,
    fabric,
    setFabric,
    undo,
    redo,
    duplicate,
    canUndo,
    canRedo,
  } = useDesignStore(
      useShallow((s) => ({
        undo: s.undo,
        redo: s.redo,
        duplicate: s.duplicate,
        canUndo: s.past.length > 0,
        canRedo: s.future.length > 0,
        fabric: s.fabric,
        setFabric: s.setFabric,
        elements: s.elements,
        selectedId: s.selectedId,
        addText: s.addText,
        addShape: s.addShape,
        addMonogram: s.addMonogram,
        update: s.update,
        remove: s.remove,
        moveInOrder: s.moveInOrder,
        select: s.select,
      })),
    );
  const fontInput = useRef<HTMLInputElement>(null);
  const selected = elements.find((e) => e.id === selectedId) ?? null;

  const handleFontFile = async (file: File | undefined) => {
    if (!file || !selected || (selected.kind !== "text" && selected.kind !== "monogram")) return;
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
  const isApplique = selected?.mode === "applique";

  const changeMode = (el: DesignElement, mode: StitchMode) => {
    // satin wants denser rows than a fill
    let density = el.density;
    if (mode === "satin" && el.mode !== "satin") density = FABRIC_PROFILES[fabric].satinSpacing;
    if (mode !== "satin" && el.mode === "satin") density = 0.4;
    const borderWidth = mode === "applique" ? Math.max(3, el.borderWidth ?? 3) : el.borderWidth;
    update(el.id, { mode, density, borderWidth });
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel title={t("fabricProfile.title")} help="help.fabric">
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

      <PlacementPanel design={design} />

      <Panel title={t("elements.title")} help="help.elements">
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
          <button
            type="button"
            onClick={addMonogram}
            className="flex-1 rounded-md bg-denim-900 px-3 py-2 text-sm font-medium text-white hover:bg-denim-700"
          >
            {t("elements.addMonogram")}
          </button>
        </div>

        <div className="mb-3 flex gap-1">
          <IconButton label={t("elements.undo")} disabled={!canUndo} onClick={undo}>
            ↶
          </IconButton>
          <IconButton label={t("elements.redo")} disabled={!canRedo} onClick={redo}>
            ↷
          </IconButton>
          <IconButton label={t("elements.duplicate")} disabled={!selectedId} onClick={() => selectedId && duplicate(selectedId)}>
            ⧉
          </IconButton>
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
        <Panel title={elementLabel(selected, t)} help={`help.kind.${selected.kind}` as TranslationKey}>
          <div className="flex flex-col gap-3">
            {selected.kind === "text" && (
              <>
                <Field label={t("edit.text")} help="help.text">
                  <textarea
                    className={inputClass + " min-h-16 font-medium"}
                    value={selected.text}
                    onChange={(e) => update(selected.id, { text: e.target.value })}
                  />
                </Field>
                <Group label={t("edit.font")} help="help.font">
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
                    help="help.height"
                    value={selected.height}
                    step={0.5}
                    min={3}
                    max={90}
                    onChange={(v) => update(selected.id, { height: v })}
                  />
                  <NumField
                    label={t("edit.letterSpacing")}
                    help="help.letterSpacing"
                    value={selected.letterSpacing}
                    step={0.1}
                    onChange={(v) => update(selected.id, { letterSpacing: v })}
                  />
                  <NumField
                    label={t("edit.lineSpacing")}
                    help="help.lineSpacing"
                    value={selected.lineSpacing}
                    step={0.1}
                    min={0.8}
                    onChange={(v) => update(selected.id, { lineSpacing: v })}
                  />
                </div>
              </>
            )}

            {selected.kind === "text" && (
              <div className="grid grid-cols-2 gap-2">
                <Field label={t("edit.arc")} help="help.arc">
                  <select
                    className={inputClass}
                    value={selected.arc ?? "none"}
                    onChange={(e) => update(selected.id, { arc: e.target.value as TextArc })}
                  >
                    {(["none", "top", "bottom"] as TextArc[]).map((a) => (
                      <option key={a} value={a}>
                        {t(`arc.${a}` as TranslationKey)}
                      </option>
                    ))}
                  </select>
                </Field>
                {(selected.arc ?? "none") === "none" ? (
                  <Group label={t("edit.align")} help="help.align">
                    <div className="grid grid-cols-3 overflow-hidden rounded-md ring-1 ring-denim-200">
                      {(["left", "center", "right"] as TextAlign[]).map((a) => (
                        <button
                          key={a}
                          type="button"
                          aria-pressed={(selected.align ?? "center") === a}
                          onClick={() => update(selected.id, { align: a })}
                          className={
                            "py-1.5 text-xs " +
                            ((selected.align ?? "center") === a ? "bg-denim-900 text-white" : "bg-white hover:bg-denim-50")
                          }
                        >
                          {t(`align.${a}` as TranslationKey)}
                        </button>
                      ))}
                    </div>
                  </Group>
                ) : (
                  <NumField
                    label={t("edit.arcRadius")}
                    help="help.arcRadius"
                    value={selected.arcRadius ?? 40}
                    step={1}
                    min={10}
                    max={200}
                    onChange={(v) => update(selected.id, { arcRadius: Math.min(200, Math.max(10, v)) })}
                  />
                )}
              </div>
            )}

            {selected.kind === "text" && !isApplique && (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Field label={t("edit.outline")} help="help.outline">
                    <select
                      className={inputClass}
                      value={selected.outlineStyle ?? "none"}
                      onChange={(e) =>
                        update(selected.id, {
                          outlineStyle: e.target.value as "none" | "border" | "shadow",
                          outlineColor: selected.outlineColor ?? nearestThread("#ffffff").hex,
                        })
                      }
                    >
                      <option value="none">{t("outline.none")}</option>
                      <option value="border">{t("outline.border")}</option>
                      <option value="shadow">{t("outline.shadow")}</option>
                    </select>
                  </Field>
                  {(selected.outlineStyle ?? "none") !== "none" && (
                    <NumField
                      label={selected.outlineStyle === "shadow" ? t("edit.shadowOffset") : t("edit.outlineWidth")}
                      help="help.outlineWidth"
                      value={selected.outlineWidth ?? 1.5}
                      step={0.25}
                      min={0.5}
                      max={4}
                      onChange={(v) => update(selected.id, { outlineWidth: Math.min(4, Math.max(0.5, v)) })}
                    />
                  )}
                </div>
                {(selected.outlineStyle ?? "none") !== "none" && (
                  <Group label={t("edit.outlineColor")}>
                    <ColorPicker
                      value={selected.outlineColor ?? nearestThread("#ffffff").hex}
                      onPick={(hex) => update(selected.id, { outlineColor: hex })}
                    />
                  </Group>
                )}
              </div>
            )}

            {selected.kind === "monogram" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Field label={t("edit.monoLetters")} help="help.monoLetters">
                    <input
                      className={inputClass + " font-semibold uppercase tracking-widest"}
                      value={selected.letters}
                      maxLength={3}
                      onChange={(e) => update(selected.id, { letters: e.target.value.toUpperCase().slice(0, 3) })}
                    />
                  </Field>
                  <Field label={t("edit.monoStyle")} help="help.monoStyle">
                    <select
                      className={inputClass}
                      value={selected.style}
                      onChange={(e) => update(selected.id, { style: e.target.value as "classic" | "equal" })}
                    >
                      <option value="classic">{t("mono.classic")}</option>
                      <option value="equal">{t("mono.equal")}</option>
                    </select>
                  </Field>
                </div>
                <Group label={t("edit.font")} help="help.font">
                  <FontPicker
                    value={isFontAvailable(selected.fontId) ? selected.fontId : DEFAULT_FONT_ID}
                    sample={selected.letters || "ABC"}
                    onChange={(id) => update(selected.id, { fontId: id })}
                    onUpload={() => fontInput.current?.click()}
                  />
                </Group>
                <div className="grid grid-cols-2 gap-2">
                  <NumField
                    label={t("edit.letterHeight")}
                    help="help.height"
                    value={selected.height}
                    step={0.5}
                    min={5}
                    max={90}
                    onChange={(v) => update(selected.id, { height: v })}
                  />
                  <NumField
                    label={t("edit.letterSpacing")}
                    help="help.letterSpacing"
                    value={selected.letterSpacing}
                    step={0.5}
                    onChange={(v) => update(selected.id, { letterSpacing: v })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Field label={t("edit.monoFrame")} help="help.monoFrame">
                    <select
                      className={inputClass}
                      value={selected.frame}
                      onChange={(e) => update(selected.id, { frame: e.target.value as MonogramFrame })}
                    >
                      {FRAMES.map((f) => (
                        <option key={f} value={f}>
                          {t(`frame.${f}` as TranslationKey)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {selected.frame !== "none" && (
                    <>
                      <NumField
                        label={t("edit.frameWidth")}
                        value={selected.frameWidth}
                        step={0.25}
                        min={1}
                        max={5}
                        onChange={(v) => update(selected.id, { frameWidth: Math.min(5, Math.max(1, v)) })}
                      />
                      <NumField
                        label={t("edit.frameGap")}
                        value={selected.frameGap}
                        step={0.5}
                        min={0}
                        max={15}
                        onChange={(v) => update(selected.id, { frameGap: Math.min(15, Math.max(0, v)) })}
                      />
                    </>
                  )}
                </div>
                {selected.frame !== "none" && (
                  <Group label={t("edit.frameColor")}>
                    <ColorPicker value={selected.frameColor} onPick={(hex) => update(selected.id, { frameColor: hex })} />
                  </Group>
                )}
              </>
            )}

            {selected.kind === "shape" && (
              <>
                <Field label={t("edit.shape")} help="help.shape">
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
                    help="help.size"
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
                    help="help.size"
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
                help="help.position"
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

            <div className="grid grid-cols-[1fr_auto] items-end gap-2">
              <NumField
                label={t("edit.rotation")}
                help="help.rotation"
                value={selected.rotation ?? 0}
                step={5}
                min={-180}
                max={180}
                onChange={(v) => update(selected.id, { rotation: ((((v + 180) % 360) + 360) % 360) - 180 })}
              />
              <div className="flex gap-1 pb-0.5" title={t("edit.centerTitle")}>
                <button
                  type="button"
                  onClick={() => update(selected.id, { x: 0 })}
                  className="rounded-md bg-white px-2 py-1.5 text-xs ring-1 ring-denim-200 hover:bg-denim-50"
                >
                  {t("edit.centerH")}
                </button>
                <button
                  type="button"
                  onClick={() => update(selected.id, { y: 0 })}
                  className="rounded-md bg-white px-2 py-1.5 text-xs ring-1 ring-denim-200 hover:bg-denim-50"
                >
                  {t("edit.centerV")}
                </button>
              </div>
            </div>

            <Field label={t("edit.mode")} help="help.mode">
              <select
                className={inputClass}
                value={selected.mode}
                onChange={(e) => changeMode(selected, e.target.value as StitchMode)}
              >
                {MODES.filter((m) => !(m === "applique" && selected.kind === "monogram")).map((m) => (
                  <option key={m} value={m}>
                    {t(`mode.${m}` as TranslationKey)}
                  </option>
                ))}
              </select>
            </Field>

            {isSatin && <p className="text-xs text-denim-700">{t("edit.satinHint")}</p>}

            {isApplique && (
              <div className="flex flex-col gap-2">
                <p className="rounded-md bg-denim-50 px-2 py-1.5 text-xs text-denim-900">{t("edit.appliqueHint")}</p>
                <NumField
                  label={t("edit.coverWidth")}
                  help="help.coverWidth"
                  value={selected.borderWidth ?? 3}
                  step={0.5}
                  min={2}
                  max={6}
                  onChange={(v) => update(selected.id, { borderWidth: Math.min(6, Math.max(2, v)) })}
                />
              </div>
            )}

            {selected.mode !== "outline" && !isApplique && (
              <div className="grid grid-cols-3 items-end gap-2">
                {!isSatin && (
                  <NumField
                    label={t("edit.angle")}
                    help="help.angle"
                    value={selected.angle}
                    step={15}
                    onChange={(v) => update(selected.id, { angle: v })}
                  />
                )}
                <NumField
                  label={isSatin ? t("edit.satinSpacing") : t("edit.density")}
                  help={isSatin ? "help.satinSpacing" : "help.density"}
                  value={selected.density}
                  step={0.05}
                  min={isSatin ? 0.2 : 0.3}
                  max={1}
                  onChange={(v) => update(selected.id, { density: Math.max(isSatin ? 0.2 : 0.3, v) })}
                />
                {selected.mode === "fill-satin" && (
                  <NumField
                    label={t("edit.borderWidth")}
                    help="help.borderWidth"
                    value={selected.borderWidth ?? 2}
                    step={0.5}
                    min={1}
                    max={6}
                    onChange={(v) => update(selected.id, { borderWidth: Math.min(6, Math.max(1, v)) })}
                  />
                )}
                <label className="flex items-center gap-2 pb-2 text-xs font-medium text-denim-700">
                  <HelpButton topic="help.underlay" />
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
              <Field label={t("svg.colors")} help="help.svgColors">
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
              <Group label={t("edit.color")} help="help.color">
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

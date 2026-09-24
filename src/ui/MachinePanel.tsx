import type { ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { useLang, useT, type TranslationKey } from "../i18n";
import type { GeneratedDesign } from "../engine/compose";
import { MachineStatus } from "../machine/types";
import { designKey, useMachineStore } from "../machine/useMachineStore";
import {
  canDelete,
  canMaskTrace,
  canResume,
  canStartSewing,
  canStepStitches,
  canUpload,
  hasMachineError,
  machineErrorInfo,
} from "../machine/errors";
import { colorLabel } from "../designer/palette";
import { Panel } from "./fields";

function ActionButton({
  children,
  onClick,
  disabled,
  secondary,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "w-full rounded-md px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 " +
        (secondary
          ? "bg-white text-denim-900 ring-1 ring-denim-200 hover:bg-denim-50"
          : "bg-thread-500 text-denim-950 hover:bg-thread-600")
      }
    >
      {children}
    </button>
  );
}

function Hint({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "warn" }) {
  return (
    <p
      className={
        "rounded-md px-3 py-2 text-sm " +
        (tone === "warn" ? "bg-thread-100 text-denim-950" : "bg-denim-50 text-denim-900")
      }
    >
      {children}
    </p>
  );
}

export function MachinePanel({ design, fitsHoop }: { design: GeneratedDesign; fitsHoop: boolean }) {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const m = useMachineStore(
    useShallow((s) => ({
      supported: s.supported,
      isConnected: s.isConnected,
      isConnecting: s.isConnecting,
      info: s.info,
      status: s.status,
      errorCode: s.errorCode,
      patternInfo: s.patternInfo,
      progress: s.progress,
      isUploading: s.isUploading,
      uploadProgress: s.uploadProgress,
      uploaded: s.uploaded,
      problem: s.problem,
      adjustedStitch: s.adjustedStitch,
    })),
  );
  const actions = useMachineStore(
    useShallow((s) => ({
      connect: s.connect,
      disconnect: s.disconnect,
      upload: s.upload,
      startMaskTrace: s.startMaskTrace,
      startSewing: s.startSewing,
      deletePattern: s.deletePattern,
      stepStitch: s.stepStitch,
      clearProblem: s.clearProblem,
    })),
  );

  const problem = m.problem && (
    <div role="alert" className="flex items-start gap-2 rounded-md bg-thread-100 px-3 py-2 text-sm text-denim-950">
      <span className="flex-1">{t(m.problem.key, { detail: m.problem.detail ?? "" })}</span>
      <button type="button" onClick={actions.clearProblem} className="font-semibold" aria-label="OK">
        ×
      </button>
    </div>
  );

  if (!m.supported)
    return (
      <Panel title={t("machine.title")}>
        <Hint>{t("machine.unsupported")}</Hint>
      </Panel>
    );

  if (!m.isConnected)
    return (
      <Panel title={t("machine.title")}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-denim-700">{t("machine.intro")}</p>
          {problem}
          <ActionButton onClick={actions.connect} disabled={m.isConnecting}>
            {m.isConnecting ? t("machine.connecting") : t("machine.connect")}
          </ActionButton>
        </div>
      </Panel>
    );

  const total = m.patternInfo?.totalStitches ?? m.uploaded?.totalStitches ?? 0;
  const current = m.adjustedStitch ?? m.progress?.currentStitch ?? 0;
  const hasPattern = total > 0;
  const hasProgress = current > 0;
  const percent = total ? Math.min(100, (current / total) * 100) : 0;
  const block = m.uploaded?.colorBlocks.find((b) => current >= b.startStitch && current <= b.endStitch);
  const currentColor = block ? m.uploaded?.blockColors[block.colorIndex] : undefined;
  const nextBlock =
    block && m.uploaded ? m.uploaded.colorBlocks.find((b) => b.startStitch > block.endStitch) : undefined;
  const nextColor = nextBlock ? m.uploaded?.blockColors[nextBlock.colorIndex] : currentColor;
  const changed = !!m.uploaded && m.uploaded.key !== designKey(design.stitches);
  const err = hasMachineError(m.errorCode) ? machineErrorInfo(m.errorCode, lang) : null;
  const statusText = t(`status.${m.status}` as TranslationKey);
  const fmt = (n: number) => n.toLocaleString(lang === "de" ? "de-AT" : "en-GB");

  return (
    <Panel title={t("machine.title")}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
          <span className="flex-1 truncate">{t("machine.connected", { model: m.info?.modelNumber || "PP1" })}</span>
          <button type="button" onClick={actions.disconnect} className="text-xs text-denim-500 underline">
            {t("machine.disconnect")}
          </button>
        </div>
        <p className="text-xs text-denim-700">{t("machine.status", { status: statusText })}</p>
        {problem}

        {err && (
          <div className={"rounded-md px-3 py-2 text-sm " + (err.informational ? "bg-denim-50" : "bg-thread-100")}>
            <p className="font-semibold text-denim-950">{err.title}</p>
            <p className="mb-1 text-denim-900">{err.description}</p>
            <p className="text-xs font-medium text-denim-700">{t("machine.solutions")}</p>
            <ol className="ml-4 list-decimal text-denim-900">
              {err.solutions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
        )}

        {hasPattern && <p className="text-xs text-denim-700">{t("machine.onMachine", { n: fmt(total) })}</p>}
        {changed && hasPattern && <Hint tone="warn">{t("machine.changedSinceUpload")}</Hint>}

        {/* Sending */}
        {m.isUploading ? (
          <div>
            <p className="mb-1 text-sm">{t("machine.uploading", { n: Math.round(m.uploadProgress) })}</p>
            <div className="h-2 overflow-hidden rounded-full bg-denim-100">
              <div className="h-full bg-thread-500" style={{ width: `${m.uploadProgress}%` }} />
            </div>
          </div>
        ) : (
          canUpload(m.status) &&
          (m.status === MachineStatus.SEWING_COMPLETE || (!hasProgress && (!hasPattern || changed))) && (
            <>
              {design.stitches.length < 2 && <Hint>{t("machine.uploadEmpty")}</Hint>}
              {design.stitches.length >= 2 && !fitsHoop && <Hint tone="warn">{t("machine.uploadOutside")}</Hint>}
              <ActionButton
                onClick={async () => {
                  if (hasPattern) await actions.deletePattern();
                  await actions.upload(design.stitches, design.blockColors);
                }}
                disabled={design.stitches.length < 2 || !fitsHoop || hasMachineError(m.errorCode)}
              >
                {t("machine.upload")}
              </ActionButton>
            </>
          )
        )}

        {/* Mask trace */}
        {hasPattern && !changed && canMaskTrace(m.status, hasProgress) && (
          <>
            <p className="text-sm text-denim-700">{t("machine.maskTraceHint")}</p>
            <ActionButton
              secondary={m.status === MachineStatus.MASK_TRACE_COMPLETE}
              onClick={actions.startMaskTrace}
            >
              {t("machine.maskTrace")}
            </ActionButton>
          </>
        )}
        {m.status === MachineStatus.MASK_TRACE_LOCK_WAIT && <Hint>{t("machine.maskTraceWait")}</Hint>}
        {m.status === MachineStatus.MASK_TRACING && <Hint>{t("machine.maskTracing")}</Hint>}

        {/* Sewing */}
        {canStartSewing(m.status) && (
          <>
            <ActionButton onClick={actions.startSewing}>
              {canResume(m.status) ? t("machine.resume") : t("machine.startSewing")}
            </ActionButton>
            <p className="text-xs text-denim-700">{t("machine.startSewingHint")}</p>
          </>
        )}

        {hasProgress && total > 0 && m.status !== MachineStatus.SEWING_COMPLETE && (
          <div>
            <p className="mb-1 text-sm">
              {m.status === MachineStatus.SEWING
                ? t("machine.sewing", { cur: fmt(current), total: fmt(total) })
                : m.status === MachineStatus.COLOR_CHANGE_WAIT
                  ? t("machine.progressAt", { cur: fmt(current), total: fmt(total) })
                  : t("machine.paused", { cur: fmt(current), total: fmt(total) })}
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-denim-100">
              <div className="h-full bg-thread-500 transition-[width]" style={{ width: `${percent}%` }} />
            </div>
            {currentColor && (
              <p className="mt-2 flex items-center gap-2 text-sm">
                <span className="h-4 w-4 rounded-full ring-1 ring-denim-200" style={{ background: currentColor }} />
                {t("machine.currentColor")}: {colorLabel(currentColor)}
              </p>
            )}
          </div>
        )}

        {m.status === MachineStatus.COLOR_CHANGE_WAIT && (
          <Hint tone="warn">{t("machine.colorChange", { color: colorLabel(nextColor) })}</Hint>
        )}

        {canStepStitches(m.status, hasProgress) && (
          <div>
            <p className="mb-1 text-xs font-medium text-denim-700">{t("machine.step")}</p>
            <div className="grid grid-cols-4 gap-1">
              {[-10, -1, 1, 10].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => actions.stepStitch(d)}
                  className="rounded-md bg-white py-1 text-sm ring-1 ring-denim-200 hover:bg-denim-50"
                >
                  {d > 0 ? `+${d}` : d}
                </button>
              ))}
            </div>
          </div>
        )}

        {m.status === MachineStatus.SEWING_COMPLETE && <Hint>{t("machine.complete")}</Hint>}

        {hasPattern && canDelete(m.status) && !m.isUploading && (
          <ActionButton secondary onClick={actions.deletePattern}>
            {t("machine.delete")}
          </ActionButton>
        )}
      </div>
    </Panel>
  );
}

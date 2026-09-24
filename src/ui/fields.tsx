import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-md border border-denim-200 bg-white px-2 py-1.5 text-sm text-ink " +
  "focus:border-thread-500 focus:outline-none focus:ring-2 focus:ring-thread-500/40";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-denim-700">
      {label}
      {children}
    </label>
  );
}

/** Like Field, but not a <label>: for composite controls such as pickers. */
export function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1 text-xs font-medium text-denim-700">
      <span>{label}</span>
      {children}
    </div>
  );
}

export function NumField(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  const { label, value, onChange, step = 1, min, max } = props;
  return (
    <Field label={label}>
      <input
        type="number"
        className={inputClass}
        value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!Number.isNaN(v)) onChange(v);
        }}
      />
    </Field>
  );
}

export function Panel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl bg-white shadow-[0_1px_0_rgba(23,32,51,0.08)] ring-1 ring-denim-100 ${className}`}>
      {title && (
        <h2 className="px-4 pt-3 pb-1 font-display text-sm tracking-wide text-denim-900">{title}</h2>
      )}
      <div className="px-4 pb-4 pt-2">{children}</div>
    </section>
  );
}

export function ToolButton({
  children,
  onClick,
  disabled,
  primary,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 " +
        (primary
          ? "bg-thread-500 text-denim-950 hover:bg-thread-600"
          : "text-denim-100 hover:bg-denim-700")
      }
    >
      {children}
    </button>
  );
}

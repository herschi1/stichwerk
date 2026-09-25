import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useT, type TranslationKey } from "../i18n";

/**
 * Small ⓘ button that opens a short explanation. Opens on click (works with
 * keyboard and touch too), closes on outside click, Escape or scrolling.
 */
export function HelpButton({ topic, className = "" }: { topic: TranslationKey; className?: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const width = Math.min(288, window.innerWidth - 16);
    const left = Math.max(8, Math.min(r.left - 12, window.innerWidth - width - 8));
    const below = r.bottom + 6;
    const height = pop.current?.offsetHeight ?? 120;
    const top = below + height > window.innerHeight - 8 ? Math.max(8, r.top - height - 6) : below;
    setPos({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === "Escape") {
          // only close the help, don't also deselect the element
          e.stopPropagation();
          setOpen(false);
          btn.current?.focus();
        }
        return;
      }
      const target = e.target as Node;
      if (!pop.current?.contains(target) && !btn.current?.contains(target)) setOpen(false);
    };
    const onScroll = (e: Event) => {
      if (!pop.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-label={t("help.button")}
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={
          "inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold leading-none " +
          (open ? "bg-thread-500 text-denim-950" : "bg-denim-100 text-denim-700 hover:bg-thread-100 hover:text-denim-950") +
          " " +
          className
        }
      >
        i
      </button>
      {open &&
        createPortal(
          <div
            ref={pop}
            role="dialog"
            style={{ top: pos.top, left: pos.left }}
            className="fixed z-50 w-72 max-w-[calc(100vw-16px)] rounded-lg bg-denim-950 px-3 py-2.5 text-[13px] font-normal leading-relaxed text-denim-50 shadow-xl"
          >
            {t(topic)
              .split("\n")
              .map((line, i) => (
                <p key={i} className={i ? "mt-1.5" : ""}>
                  {line}
                </p>
              ))}
          </div>,
          document.body,
        )}
    </>
  );
}

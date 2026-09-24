import { useEffect, useRef, type ReactNode } from "react";
import { useT } from "../i18n";
import { SITE } from "../site.config";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-1 font-display text-sm text-denim-900">{title}</h3>
      <div className="flex flex-col gap-2 text-sm leading-relaxed text-denim-950">{children}</div>
    </section>
  );
}

const link = "font-medium text-denim-900 underline decoration-thread-500 underline-offset-2";

export function InfoDialog({ onClose }: { onClose: () => void }) {
  const t = useT();
  const dialog = useRef<HTMLDialogElement>(null);
  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    const d = dialog.current;
    d?.showModal();
    return () => d?.close();
  }, []);

  const hasOwner = SITE.ownerName.trim() && SITE.ownerLocation.trim();

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && onClose()}
      className="m-auto max-h-[85vh] w-[min(40rem,92vw)] overflow-y-auto rounded-xl bg-white p-0 text-ink shadow-2xl backdrop:bg-denim-950/50"
      aria-labelledby="info-title"
    >
      <div className="sticky top-0 flex items-center justify-between bg-denim-900 px-5 py-3 text-white">
        <h2 id="info-title" className="font-display text-lg">
          {t("info.title")}
        </h2>
        <button type="button" onClick={onClose} className="rounded px-2 text-xl leading-none hover:bg-denim-700" aria-label={t("info.close")}>
          ×
        </button>
      </div>
      <div className="px-5 py-4">
        <Section title={t("info.about.title")}>
          <p>{t("info.about.text")}</p>
          <p>{t("info.about.risk")}</p>
          <p className="text-xs text-denim-700">{t("info.about.trademarks")}</p>
        </Section>

        <Section title={t("info.privacy.title")}>
          <p>{t("info.privacy.local")}</p>
          <p>{t("info.privacy.bluetooth")}</p>
          <p>
            {t("info.privacy.hosting")}{" "}
            <a className={link} href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noreferrer">
              {t("info.privacy.githubLink")}
            </a>
          </p>
        </Section>

        <Section title={t("info.licence.title")}>
          <p>
            {t("info.licence.text")}{" "}
            <a className={link} href={SITE.repoUrl} target="_blank" rel="noreferrer">
              {SITE.repoUrl.replace("https://", "")}
            </a>
          </p>
          <ul className="ml-4 list-disc text-sm">
            <li>{t("info.licence.respira")}</li>
            <li>{t("info.licence.pyembroidery")}</li>
            <li>{t("info.licence.inkstitch")}</li>
            <li>
              {t("info.licence.fonts")}{" "}
              <a className={link} href={`${base}fonts/FONTS.md`} target="_blank" rel="noreferrer">
                FONTS.md
              </a>
            </li>
          </ul>
        </Section>

        {hasOwner && (
          <Section title={t("info.imprint.title")}>
            <p>
              {t("info.imprint.owner")}: {SITE.ownerName}, {SITE.ownerLocation}
            </p>
            <p>{t("info.imprint.purpose")}</p>
          </Section>
        )}
      </div>
    </dialog>
  );
}

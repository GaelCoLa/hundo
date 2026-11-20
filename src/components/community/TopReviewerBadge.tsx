// Insignia "Top reviewer": la gana quien recibió 50 o más "útil" en total.
// No depende de títulos ni profesión (spec §5.3): solo de lo que votó la comunidad.
import { useTranslations } from "next-intl";

export function TopReviewerBadge() {
  const t = useTranslations("community");
  return (
    <span
      title={t("topReviewerLabel")}
      className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-accent-ink"
    >
      <span aria-hidden="true">★</span>
      Top reviewer
      <span className="sr-only">: {t("topReviewerLabel")}</span>
    </span>
  );
}

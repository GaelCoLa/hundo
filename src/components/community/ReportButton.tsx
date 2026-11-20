"use client";
// "Reportar" una reseña: un link discreto que despliega el formulario (motivo
// y detalle opcional). Los reportes los revisa un administrador en /admin.
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { reportReview, type ReportState } from "@/app/[locale]/community-actions";
import { FormError } from "@/components/auth/AuthFields";
import { REPORT_REASONS } from "@/lib/moderation";

export function ReportButton({ ratingId }: { ratingId: string }) {
  const t = useTranslations("report");
  const [state, action, pending] = useActionState<ReportState, FormData>(reportReview.bind(null, ratingId), {});

  if (state.sent) return <p className="text-sm text-soft">{t("thanks")}</p>;

  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-sm text-muted hover:text-ink [&::-webkit-details-marker]:hidden">{t("open")}</summary>
      <form action={action} className="mt-3 flex flex-col gap-3 rounded-[14px] bg-bg p-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">{t("reasonLabel")}</legend>
          {REPORT_REASONS.map((r, i) => (
            <label key={r} className="flex items-center gap-2 text-sm">
              <input type="radio" name="reason" value={r} defaultChecked={i === 0} className="accent-[var(--color-accent)]" />
              {t(`reasons.${r}`)}
            </label>
          ))}
        </fieldset>
        <label className="flex flex-col gap-1.5 text-sm text-muted">
          {t("detailsLabel")}
          <textarea name="details" rows={2} maxLength={500} className="rounded-[10px] border border-line bg-surface px-3 py-2 text-[15px] text-ink" />
        </label>
        {state.error ? <FormError>{t(`errors.${state.error}`)}</FormError> : null}
        <button type="submit" disabled={pending} className="btn-pop btn-pop-ghost h-10 self-start rounded-xl border-2 border-line px-4 text-sm font-semibold disabled:opacity-60">
          {t("send")}
        </button>
      </form>
    </details>
  );
}

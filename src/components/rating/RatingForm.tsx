"use client";
// Formulario para calificar un juego. Si ya lo calificaste, viene completo
// con tus datos y guardar actualiza la misma calificación.
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { submitRating, type RatingState } from "@/app/[locale]/games/[slug]/actions";
import { FormError } from "@/components/auth/AuthFields";
import { ScoreSlider } from "./ScoreSlider";

export type ExistingRating = {
  score: number;
  review: string | null;
  hasSpoilers: boolean;
  hoursPlayed: number | null;
  finishedOn: string | null;
};

export function RatingForm({ gameId, existing }: { gameId: number; existing: ExistingRating | null }) {
  const t = useTranslations("rating");
  const [state, formAction, pending] = useActionState<RatingState, FormData>(submitRating.bind(null, gameId), {});
  // Valores iniciales: lo que se escribió si hubo un error; si no, lo guardado.
  const v = state.values;
  const today = new Date().toISOString().slice(0, 10);
  const input = "h-11 rounded-[10px] border border-line bg-bg px-3 text-[15px] text-ink";

  return (
    <form action={formAction} className="flex flex-col gap-5 rounded-[20px] bg-surface p-6 sm:p-7" noValidate>
      <h2 className="text-lg font-semibold">{existing ? t("editTitle") : t("title")}</h2>
      {state.error ? <FormError>{t(`errors.${state.error}`)}</FormError> : null}
      {(state.saved || state.deleted) && !pending ? (
        <p role="status" className="text-sm font-semibold text-scale-great">
          {t(state.saved ? "saved" : "deleted")}
        </p>
      ) : null}

      <ScoreSlider defaultValue={existing?.score ?? 75} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm text-muted">
          {t("hours")}
          <input name="hours" inputMode="decimal" placeholder="85.7" defaultValue={v ? v.hours : (existing?.hoursPlayed ?? "")} className={input} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-muted">
          {t("finishedOn")}
          <input name="finishedOn" type="date" max={today} defaultValue={v ? v.finishedOn : (existing?.finishedOn ?? "")} className={input} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm text-muted">
        {t("review")}
        <textarea
          name="review"
          rows={5}
          maxLength={5000}
          defaultValue={v ? v.review : (existing?.review ?? "")}
          placeholder={t("reviewPlaceholder")}
          className="rounded-[10px] border border-line bg-bg px-3 py-2.5 text-[15px] leading-relaxed text-ink"
        />
      </label>

      <label className="flex items-center gap-2.5 text-sm">
        <input name="hasSpoilers" type="checkbox" defaultChecked={v ? v.hasSpoilers !== null : (existing?.hasSpoilers ?? false)} className="size-4 accent-[var(--color-accent)]" />
        {t("hasSpoilers")}
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="h-12 rounded-xl bg-accent px-6 font-bold text-accent-ink disabled:opacity-60"
        >
          {existing ? t("update") : t("save")}
        </button>
        {existing ? (
          <button
            type="submit"
            name="intent"
            value="delete"
            formNoValidate
            onClick={(e) => {
              // Borrar no se puede deshacer: pedimos confirmación antes.
              if (!window.confirm(t("confirmDelete"))) e.preventDefault();
            }}
            className="h-12 rounded-xl border-2 border-line px-5 font-semibold text-soft hover:text-ink"
          >
            {t("delete")}
          </button>
        ) : null}
      </div>
    </form>
  );
}

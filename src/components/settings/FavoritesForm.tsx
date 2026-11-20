"use client";
// Elegir el Top 5: cinco desplegables con los juegos que calificaste. El orden
// de los desplegables es el orden en que se muestran en tu perfil.
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { updateFavorites, type FavoritesState } from "@/app/[locale]/settings/actions";
import { FormError } from "@/components/auth/AuthFields";

type Props = { options: { id: number; name: string }[]; current: number[] };

export function FavoritesForm({ options, current }: Props) {
  const t = useTranslations("settings");
  const [state, action, pending] = useActionState<FavoritesState, FormData>(updateFavorites, {});

  return (
    <section aria-labelledby="favorites-edit" className="flex flex-col gap-4 rounded-[20px] bg-surface p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h2 id="favorites-edit" className="text-lg font-semibold">
          {t("favoritesTitle")}
        </h2>
        <p className="text-sm text-muted">{t("favoritesHint")}</p>
      </div>
      {options.length === 0 ? (
        <p className="text-soft">{t("favoritesEmpty")}</p>
      ) : (
        <form action={action} className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map((pos) => (
            <label key={pos} className="flex items-center gap-3">
              <span className="w-8 font-display text-2xl font-black text-muted">{pos}.º</span>
              <select
                name={`fav${pos}`}
                defaultValue={current[pos - 1] ?? ""}
                aria-label={t("favoritePosition", { pos })}
                className="h-11 grow rounded-[10px] border border-line bg-bg px-3 text-[15px] text-ink"
              >
                <option value="">—</option>
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {state.error ? <FormError>{t(`errors.${state.error}`)}</FormError> : null}
          {state.saved && !pending ? (
            <motion.p role="status" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-semibold text-scale-great">
              ✓ {t("favoritesSaved")}
            </motion.p>
          ) : null}
          <button type="submit" disabled={pending} className="btn-pop h-12 self-start rounded-xl bg-accent px-6 font-bold text-accent-ink disabled:opacity-60">
            {t("save")}
          </button>
        </form>
      )}
    </section>
  );
}

"use client";
// Botón Seguir / Siguiendo. Igual que "Útil": useOptimistic cambia el botón y el
// contador de seguidores al instante y el servidor confirma después.
import { useOptimistic, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleFollow } from "@/app/[locale]/community-actions";

type Props = { followeeId: string; following: boolean; followers: number };

export function FollowButton({ followeeId, following, followers }: Props) {
  const t = useTranslations("community");
  const [pending, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic({ following, followers }, (s, next: boolean) => ({
    following: next,
    followers: s.followers + (next ? 1 : -1),
  }));

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-soft">
        <strong className="font-display text-2xl font-black text-ink">{state.followers}</strong> {t("followers", { count: state.followers })}
      </span>
      <button
        type="button"
        disabled={pending}
        aria-pressed={state.following}
        onClick={() =>
          startTransition(async () => {
            setOptimistic(!state.following);
            await toggleFollow(followeeId, !state.following);
          })
        }
        className={`btn-pop h-10 rounded-xl px-5 font-bold disabled:opacity-70 ${
          state.following ? "btn-pop-ghost border-2 border-line text-soft" : "bg-accent text-accent-ink"
        }`}
      >
        {state.following ? t("following") : t("follow")}
      </button>
    </div>
  );
}

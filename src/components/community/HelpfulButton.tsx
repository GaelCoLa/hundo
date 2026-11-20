"use client";
// Botón "Útil". useOptimistic (React 19) muestra el cambio al instante, antes de
// que responda el servidor; si la acción falla, React vuelve solo al valor real.
// Mientras la acción está en curso el botón queda deshabilitado: un doble clic
// no puede mandar dos votos (y la base igual lo impediría).
import { useOptimistic, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleHelpful } from "@/app/[locale]/community-actions";

type Props = { ratingId: string; liked: boolean; count: number };

export function HelpfulButton({ ratingId, liked, count }: Props) {
  const t = useTranslations("community");
  const [pending, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic({ liked, count }, (s, next: boolean) => ({
    liked: next,
    count: s.count + (next ? 1 : -1),
  }));

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={state.liked}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!state.liked);
          await toggleHelpful(ratingId, !state.liked);
        })
      }
      className={`btn-pop btn-pop-ghost inline-flex h-9 items-center gap-2 rounded-full border-2 px-3.5 text-sm font-semibold disabled:opacity-70 ${
        state.liked ? "border-accent bg-accent/15 text-accent" : "border-line text-soft hover:text-ink"
      }`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill={state.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
        <path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3Zm0 0 4-7a2 2 0 0 1 3 2l-1 5h6a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 17.6 21H7" />
      </svg>
      {t("helpful")}
      <span className="tabular-nums">{state.count}</span>
    </button>
  );
}

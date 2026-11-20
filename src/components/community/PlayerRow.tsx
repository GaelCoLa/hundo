// Fila de un jugador en la página Jugadores: inicial, @usuario (link al perfil),
// insignia si es Top reviewer, y cuántas calificaciones y "útil" tiene.
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { isTopReviewer } from "@/lib/community";
import { TopReviewerBadge } from "./TopReviewerBadge";

export type PlayerSummary = { username: string; helpfulReceived: number; ratingsCount: number };

export function PlayerRow({ player, rank }: { player: PlayerSummary; rank?: number }) {
  const t = useTranslations("players");
  return (
    <Link
      href={`/u/${player.username}`}
      className="flex items-center gap-4 rounded-[14px] bg-surface p-3 transition duration-200 hover:translate-x-1 hover:ring-2 hover:ring-line"
    >
      {rank !== undefined ? <span className="w-6 text-right font-display text-2xl font-black text-muted">{rank}</span> : null}
      <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-accent font-bold uppercase text-accent-ink">
        {player.username[0]}
      </span>
      <span className="flex min-w-0 grow flex-col">
        <span className="flex flex-wrap items-center gap-2 font-semibold">
          @{player.username}
          {isTopReviewer(player.helpfulReceived) ? <TopReviewerBadge /> : null}
        </span>
        <span className="text-sm text-muted">
          {t("stats", { ratings: player.ratingsCount, helpful: player.helpfulReceived })}
        </span>
      </span>
    </Link>
  );
}

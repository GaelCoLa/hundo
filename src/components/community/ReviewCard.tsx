// Tarjeta de una reseña: autor (con insignia si es Top reviewer), nota, horas,
// fecha, texto (tapado si tiene spoilers) y el botón "Útil".
// Con showGame muestra además el juego reseñado (página Reseñas).
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getScaleCategory } from "@/lib/scale";
import { isTopReviewer } from "@/lib/community";
import type { ReviewData } from "@/lib/reviews-server";
import { Cover } from "@/components/games/Cover";
import { Avatar } from "@/components/Avatar";
import { HelpfulButton } from "./HelpfulButton";
import { TopReviewerBadge } from "./TopReviewerBadge";
import { ReportButton } from "./ReportButton";

type Props = {
  review: ReviewData;
  /** Quién mira: null si no inició sesión. */
  viewerId: string | null;
  likedByViewer: boolean;
  /** A dónde volver después de iniciar sesión para votar. */
  path: string;
  showGame?: boolean;
};

export async function ReviewCard({ review: r, viewerId, likedByViewer, path, showGame = false }: Props) {
  const [t, tc, format] = await Promise.all([getTranslations("game"), getTranslations("community"), getFormatter()]);
  const category = getScaleCategory(r.score);
  const meta = [
    r.hoursPlayed !== null ? t("hoursShort", { hours: r.hoursPlayed }) : null,
    r.finishedOn ? t("finished", { date: format.dateTime(new Date(`${r.finishedOn}T12:00:00Z`), { month: "short", year: "numeric" }) }) : null,
  ].filter(Boolean);
  const own = viewerId !== null && r.author?.id === viewerId;

  return (
    <article className="flex flex-col gap-3 rounded-[20px] bg-surface p-6">
      {showGame && r.game ? (
        <Link href={`/games/${r.game.slug}`} className="flex items-center gap-3 border-b border-line pb-3 hover:text-accent">
          <Cover imageId={r.game.coverImageId} name={r.game.name} size="t_cover_small" className="w-9 shrink-0" />
          <span className="font-semibold">{r.game.name}</span>
        </Link>
      ) : null}
      <header className="flex items-center gap-3.5">
        <Avatar username={r.author?.username ?? "?"} ownerId={r.author?.id ?? ""} avatarPath={r.author?.avatarUrl ?? null} size={44} />
        <div className="flex grow flex-col">
          {r.author ? (
            <span className="flex flex-wrap items-center gap-2">
              <Link href={`/u/${r.author.username}`} className="font-semibold hover:underline">
                @{r.author.username}
              </Link>
              {isTopReviewer(r.author.helpfulReceived) ? <TopReviewerBadge /> : null}
            </span>
          ) : null}
          {meta.length > 0 ? <span className="text-sm text-muted">{meta.join(" · ")}</span> : null}
        </div>
        <span className="font-display text-[44px] font-black leading-none" style={{ color: category.color }}>
          {r.score}
        </span>
      </header>
      {r.hasSpoilers ? (
        <details className="group">
          <summary className="cursor-pointer text-sm font-semibold text-accent">{t("showSpoilers")}</summary>
          <p className="mt-2 whitespace-pre-line leading-relaxed text-[#d3d8e6]">{r.review}</p>
        </details>
      ) : (
        <p className="whitespace-pre-line leading-relaxed text-[#d3d8e6]">{r.review}</p>
      )}
      <footer className="flex flex-wrap items-center gap-3 pt-1 text-sm text-muted">
        {own ? null : viewerId ? (
          <HelpfulButton ratingId={r.id} liked={likedByViewer} count={r.helpfulCount} />
        ) : (
          <Link href={`/login?next=${encodeURIComponent(path)}`} className="font-semibold text-accent underline underline-offset-4">
            {tc("signInToVote")}
          </Link>
        )}
        {own || !viewerId ? <span>{tc("helpfulCount", { count: r.helpfulCount })}</span> : null}
        {/* Reportar: solo con sesión y en reseñas ajenas. */}
        {viewerId && !own ? (
          <span className="ml-auto">
            <ReportButton ratingId={r.id} />
          </span>
        ) : null}
      </footer>
    </article>
  );
}

// Reseñas de un juego. Por defecto, las más útiles primero (spec §5.3); con
// ?reviews=recent, las más recientes. Las que tienen spoilers quedan tapadas.
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { ReviewSort } from "@/lib/community";
import { fetchReviews, fetchViewerLikes } from "@/lib/reviews-server";
import { ReviewCard } from "@/components/community/ReviewCard";
import { LinkPending } from "@/components/LinkPending";

type Props = { gameId: number; slug: string; sort: ReviewSort };

export async function ReviewList({ gameId, slug, sort }: Props) {
  const [t, supabase, viewer] = await Promise.all([getTranslations("game"), createClient(), getCurrentUser()]);
  const reviews = await fetchReviews(supabase, { sort, gameId, from: 0, limit: 20 });
  const liked = await fetchViewerLikes(supabase, viewer?.id ?? null, reviews.map((r) => r.id));
  const path = `/games/${slug}${sort === "recent" ? "?reviews=recent" : ""}`;
  const tab = (active: boolean) =>
    `relative rounded-full px-3 py-1.5 text-sm font-semibold ${active ? "bg-ink text-bg" : "bg-surface text-soft hover:text-ink"}`;

  return (
    <section aria-labelledby="reviews" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="reviews" className="font-display text-4xl font-black uppercase">
          {t("reviewsTitle")}
        </h2>
        <nav aria-label={t("sortReviews")} className="flex gap-2">
          <Link href={`/games/${slug}`} scroll={false} aria-current={sort === "helpful" ? "true" : undefined} className={tab(sort === "helpful")}>
            {t("sortHelpful")}
          <LinkPending /></Link>
          <Link href={`/games/${slug}?reviews=recent`} scroll={false} aria-current={sort === "recent" ? "true" : undefined} className={tab(sort === "recent")}>
            {t("sortRecent")}
          <LinkPending /></Link>
        </nav>
      </div>
      {reviews.length === 0 ? (
        <p className="text-soft">{t("noReviews")}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {reviews.map((r) => (
            <li key={r.id}>
              <ReviewCard review={r} viewerId={viewer?.id ?? null} likedByViewer={liked.has(r.id)} path={path} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

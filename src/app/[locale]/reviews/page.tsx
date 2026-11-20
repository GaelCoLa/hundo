// Página Reseñas: todas las reseñas del sitio, por "más útiles" o "recientes",
// de a 20 por página (?sort=recent&page=2). Depende de la sesión (el botón
// "Útil" muestra si ya votaste), así que el listado va dentro de <Suspense>.
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { parsePage, parseReviewSort } from "@/lib/community";
import { fetchReviews, fetchViewerLikes } from "@/lib/reviews-server";
import { ReviewCard } from "@/components/community/ReviewCard";
import { StaggerItem, StaggerList } from "@/components/motion/Stagger";

const PER_PAGE = 20;
type SearchParams = PageProps<"/[locale]/reviews">["searchParams"];

export default async function ReviewsPage({ searchParams }: PageProps<"/[locale]/reviews">) {
  const t = await getTranslations("reviewsPage");
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-20 pt-6 sm:px-8 sm:pt-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-6xl font-black uppercase leading-[0.9]">{t("title")}</h1>
        <p className="text-soft">{t("subtitle")}</p>
      </header>
      <Suspense fallback={<div className="h-96 rounded-[20px] bg-surface" aria-busy="true" />}>
        <ReviewsFeed searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ReviewsFeed({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const sort = parseReviewSort(query.sort);
  const page = parsePage(query.page);
  const [t, supabase, viewer] = await Promise.all([getTranslations("reviewsPage"), createClient(), getCurrentUser()]);

  const reviews = await fetchReviews(supabase, { sort, from: (page - 1) * PER_PAGE, limit: PER_PAGE });
  const liked = await fetchViewerLikes(supabase, viewer?.id ?? null, reviews.map((r) => r.id));

  const href = (s: typeof sort, p: number) => `/reviews?${new URLSearchParams({ ...(s === "recent" ? { sort: s } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`;
  const path = href(sort, page);
  const tab = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-sm font-semibold ${active ? "bg-ink text-bg" : "bg-surface text-soft hover:text-ink"}`;

  return (
    <>
      <nav aria-label={t("sortLabel")} className="flex gap-2">
        <Link href={href("helpful", 1)} aria-current={sort === "helpful" ? "true" : undefined} className={tab(sort === "helpful")}>
          {t("helpful")}
        </Link>
        <Link href={href("recent", 1)} aria-current={sort === "recent" ? "true" : undefined} className={tab(sort === "recent")}>
          {t("recent")}
        </Link>
      </nav>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-[20px] bg-surface p-6">
          <p className="text-soft">{page > 1 ? t("noMore") : t("empty")}</p>
          <Link href="/games" className="font-semibold text-accent underline underline-offset-4">
            {t("findGame")}
          </Link>
        </div>
      ) : (
        <StaggerList className="flex flex-col gap-4">
          {reviews.map((r) => (
            <StaggerItem key={r.id}>
              <ReviewCard review={r} viewerId={viewer?.id ?? null} likedByViewer={liked.has(r.id)} path={path} showGame />
            </StaggerItem>
          ))}
        </StaggerList>
      )}

      <nav aria-label={t("pagination")} className="flex justify-between">
        {page > 1 ? (
          <Link href={href(sort, page - 1)} className="font-semibold text-accent underline underline-offset-4">
            ← {t("previous")}
          </Link>
        ) : (
          <span />
        )}
        {reviews.length === PER_PAGE && page < 500 ? (
          <Link href={href(sort, page + 1)} className="font-semibold text-accent underline underline-offset-4">
            {t("next")} →
          </Link>
        ) : null}
      </nav>
    </>
  );
}

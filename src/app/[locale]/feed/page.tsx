// Feed (/feed): lo último que calificaron los jugadores que seguís, de lo más
// nuevo a lo más viejo. Paginado con cursor (?before=<fecha>): "Ver más" pide lo
// anterior a la última calificación mostrada.
import { Suspense } from "react";
import { getFormatter, getTranslations } from "next-intl/server";
import { locale } from "next/root-params";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { parseBefore } from "@/lib/community";
import { getScaleCategory } from "@/lib/scale";
import { Cover } from "@/components/games/Cover";
import { StaggerItem, StaggerList } from "@/components/motion/Stagger";

const PER_PAGE = 20;
type SearchParams = PageProps<"/[locale]/feed">["searchParams"];

type FeedRow = {
  id: string;
  score: number;
  review: string | null;
  updated_at: string;
  games: { slug: string; name: string; cover_image_id: string | null } | null;
  profiles: { username: string } | null;
};

export default async function FeedPage({ searchParams }: PageProps<"/[locale]/feed">) {
  const t = await getTranslations("feed");
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-20 pt-6 sm:px-8 sm:pt-10">
      <h1 className="font-display text-6xl font-black uppercase leading-[0.9]">{t("title")}</h1>
      <Suspense fallback={<div className="h-96 rounded-[20px] bg-surface" aria-busy="true" />}>
        <Feed searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Feed({ searchParams }: { searchParams: SearchParams }) {
  const [user, lang, query] = await Promise.all([getCurrentUser(), locale(), searchParams]);
  if (!user) redirect(`/${lang}/login?next=/feed`);
  const before = parseBefore(query.before);
  const [t, ts, format, supabase] = await Promise.all([getTranslations("feed"), getTranslations("scale"), getFormatter(), createClient()]);

  const { data: follows } = await supabase.from("follows").select("followee_id").eq("follower_id", user.id);
  const ids = (follows ?? []).map((f) => f.followee_id as string);
  if (ids.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-[20px] bg-surface p-6">
        <p className="text-soft">{t("noFollows")}</p>
        <Link href="/players" className="font-semibold text-accent underline underline-offset-4">
          {t("findPlayers")}
        </Link>
      </div>
    );
  }

  let q = supabase
    .from("ratings")
    .select("id, score, review, updated_at, games(slug, name, cover_image_id), profiles!ratings_user_id_fkey(username)")
    .in("user_id", ids)
    .order("updated_at", { ascending: false })
    .limit(PER_PAGE);
  if (before) q = q.lt("updated_at", before);
  const { data, error } = await q.returns<FeedRow[]>();
  if (error) console.error("feed failed", error.code, error.message);
  const items = (data ?? []).filter((r) => r.games && r.profiles);

  if (items.length === 0) {
    return <p className="text-soft">{before ? t("noMore") : t("empty")}</p>;
  }

  const last = items[items.length - 1]!;
  return (
    <>
      <StaggerList className="flex flex-col gap-3">
        {items.map((r) => {
          const category = getScaleCategory(r.score);
          return (
            <StaggerItem key={r.id}>
              <article className="flex gap-4 rounded-[20px] bg-surface p-4">
                <Link href={`/games/${r.games!.slug}`} className="shrink-0">
                  <Cover imageId={r.games!.cover_image_id} name={r.games!.name} size="t_cover_small" className="w-14" />
                </Link>
                <div className="flex min-w-0 grow flex-col gap-1">
                  <p className="text-sm text-soft">
                    {t.rich("rated", {
                      user: () => (
                        <Link href={`/u/${r.profiles!.username}`} className="font-semibold text-ink hover:underline">
                          @{r.profiles!.username}
                        </Link>
                      ),
                      game: () => (
                        <Link href={`/games/${r.games!.slug}`} className="font-semibold text-ink hover:underline">
                          {r.games!.name}
                        </Link>
                      ),
                    })}
                  </p>
                  {r.review ? <p className="line-clamp-3 text-sm leading-relaxed text-[#d3d8e6]">{r.review}</p> : null}
                  <time dateTime={r.updated_at} className="text-xs text-muted">
                    {format.dateTime(new Date(r.updated_at), { day: "numeric", month: "short", year: "numeric" })}
                  </time>
                </div>
                <span className="flex flex-col items-end">
                  <span className="font-display text-4xl font-black leading-none" style={{ color: category.color }}>
                    {r.score}
                  </span>
                  <span className="text-xs text-muted">{ts(category.key)}</span>
                </span>
              </article>
            </StaggerItem>
          );
        })}
      </StaggerList>
      {items.length === PER_PAGE ? (
        <Link href={`/feed?before=${encodeURIComponent(last.updated_at)}`} className="self-center font-semibold text-accent underline underline-offset-4">
          {t("more")}
        </Link>
      ) : null}
    </>
  );
}

// Juegos: /games?q=texto busca en IGDB; sin búsqueda, muestra Explorar
// (mejor puntuados, por género con ?genre=, y más reseñados).
// El título se pre-genera; lo que depende de la URL va dentro de <Suspense>.
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { searchGames } from "@/lib/igdb/client";
import { GameCard } from "@/components/games/GameCard";
import { SearchBox } from "@/components/games/SearchBox";
import { StaggerItem, StaggerList } from "@/components/motion/Stagger";
import { RankedGameRow } from "@/components/games/RankedGameRow";
import { Link } from "@/i18n/navigation";
import { getGenres, getMostReviewed, getTopRated } from "@/lib/explore";
import { pickGenre } from "@/lib/community";
import { LinkPending } from "@/components/LinkPending";

export default async function GamesPage({ searchParams }: PageProps<"/[locale]/games">) {
  const t = await getTranslations("search");
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-20 pt-6 sm:px-8 sm:pt-10">
      <h1 className="font-display text-6xl font-black uppercase leading-[0.9]">{t("title")}</h1>
      <Suspense fallback={<ResultsSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/[locale]/games">["searchParams"] }) {
  const t = await getTranslations("search");
  const params = await searchParams;
  const raw = params.q;
  const q = (Array.isArray(raw) ? raw[0] : raw ?? "").trim();

  const body = await (async () => {
    if (q === "") return <Explore genreParam={params.genre} />;
    if (q.length < 2) return <p className="text-soft">{t("tooShort")}</p>;
    const games = await searchGames(q);
    if (games.length === 0) return <p className="text-soft">{t("noResults", { q })}</p>;
    return (
      <>
        <p className="text-sm text-muted">{t("resultsFor", { q, count: games.length })}</p>
        <StaggerList className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {games.map((g) => (
            <StaggerItem key={g.id}>
              <GameCard game={g} />
            </StaggerItem>
          ))}
        </StaggerList>
      </>
    );
  })();

  return (
    <div className="flex flex-col gap-6">
      <SearchBox defaultValue={q} />
      {body}
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="h-14 max-w-2xl rounded-[10px] bg-surface" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="aspect-[3/4] rounded-lg bg-surface" />
        ))}
      </div>
    </div>
  );
}

/** Explorar: rankings de la comunidad cuando no hay búsqueda. */
async function Explore({ genreParam }: { genreParam: unknown }) {
  const [t, genres] = await Promise.all([getTranslations("explore"), getGenres()]);
  const genre = pickGenre(genreParam, genres.map((g) => g.genre));
  const [topRated, mostReviewed] = await Promise.all([getTopRated(genre), getMostReviewed()]);
  const chip = (active: boolean) =>
    `relative rounded-full px-3 py-1.5 text-sm font-semibold ${active ? "bg-ink text-bg" : "bg-surface text-soft hover:text-ink"}`;

  return (
    <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
      <section aria-labelledby="top-rated" className="flex flex-col gap-4">
        <h2 id="top-rated" className="font-display text-4xl font-black uppercase">
          {t("topRated")}
        </h2>
        {genres.length > 0 ? (
          <nav aria-label={t("byGenre")} className="flex flex-wrap gap-2">
            <Link href="/games" scroll={false} aria-current={genre === null ? "true" : undefined} className={chip(genre === null)}>
              {t("allGenres")}
            <LinkPending /></Link>
            {genres.map((g) => (
              <Link
                key={g.genre}
                href={`/games?${new URLSearchParams({ genre: g.genre })}`}
                scroll={false}
                aria-current={genre === g.genre ? "true" : undefined}
                className={chip(genre === g.genre)}
              >
                {g.genre}
              <LinkPending /></Link>
            ))}
          </nav>
        ) : null}
        {topRated.length === 0 ? (
          <p className="text-soft">
            {t("emptyTopRated")}{" "}
            <Link href="/how-scores-work" className="font-semibold text-accent underline underline-offset-4">
              {t("why")}
            </Link>
          </p>
        ) : (
          <StaggerList key={genre ?? "all"} className="flex flex-col gap-2">
            {topRated.map((g, i) => (
              <StaggerItem key={g.id}>
                <RankedGameRow game={g} position={i + 1} />
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </section>

      <section aria-labelledby="most-reviewed" className="flex flex-col gap-4">
        <h2 id="most-reviewed" className="font-display text-4xl font-black uppercase">
          {t("mostReviewed")}
        </h2>
        {mostReviewed.length === 0 ? (
          <p className="text-soft">{t("emptyMostReviewed")}</p>
        ) : (
          <StaggerList className="flex flex-col gap-2">
            {mostReviewed.map((g, i) => (
              <StaggerItem key={g.id}>
                <RankedGameRow game={g} position={i + 1} metric="reviews" />
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </section>
    </div>
  );
}

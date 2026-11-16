// Búsqueda de juegos: /games?q=texto
// El título y el buscador se pre-generan; los resultados dependen de la URL,
// así que van dentro de <Suspense> y se calculan en cada visita.
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { searchGames } from "@/lib/igdb/client";
import { GameCard } from "@/components/games/GameCard";
import { SearchBox } from "@/components/games/SearchBox";

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
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw ?? "").trim();

  const body = await (async () => {
    if (q === "") return <p className="text-soft">{t("hint")}</p>;
    if (q.length < 2) return <p className="text-soft">{t("tooShort")}</p>;
    const games = await searchGames(q);
    if (games.length === 0) return <p className="text-soft">{t("noResults", { q })}</p>;
    return (
      <>
        <p className="text-sm text-muted">{t("resultsFor", { q, count: games.length })}</p>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {games.map((g) => (
            <li key={g.id}>
              <GameCard game={g} />
            </li>
          ))}
        </ul>
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

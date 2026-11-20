// Ficha de un juego: /games/<slug-de-IGDB>
// Todo depende de datos de cada visita (base de datos, sesión), así que va en
// bloques <Suspense>: cada uno aparece apenas está listo, sin frenar al resto.
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getGame } from "@/lib/games-server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Cover } from "@/components/games/Cover";
import { CommunityScoreCard } from "@/components/games/CommunityScoreCard";
import { RatingForm, type ExistingRating } from "@/components/rating/RatingForm";
import { ReviewList } from "@/components/rating/ReviewList";

type Params = PageProps<"/[locale]/games/[slug]">["params"];

export default function GamePage({ params }: PageProps<"/[locale]/games/[slug]">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-20 pt-6 sm:px-8 sm:pt-10">
      <Suspense fallback={<div className="h-96 rounded-[28px] bg-surface" aria-busy="true" />}>
        <GameView params={params} />
      </Suspense>
    </main>
  );
}

async function GameView({ params }: { params: Params }) {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) notFound();
  const t = await getTranslations("game");

  return (
    <>
      <section className="grid items-start gap-10 lg:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col gap-6 sm:flex-row">
          <Cover imageId={game.coverImageId} name={game.name} size="t_cover_big" priority className="w-40 shrink-0 sm:w-48" />
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-5xl font-black uppercase leading-[0.92] sm:text-6xl">{game.name}</h1>
            <p className="text-soft">{[game.releaseYear, ...game.genres.slice(0, 3)].filter(Boolean).join(", ")}</p>
            {game.developers.length > 0 ? (
              <p className="text-sm text-muted">{t("by", { developers: game.developers.join(", ") })}</p>
            ) : null}
            {game.summary ? <p className="line-clamp-6 max-w-prose leading-relaxed text-soft">{game.summary}</p> : null}
          </div>
        </div>
        <CommunityScoreCard game={game} />
      </section>

      <section className="grid items-start gap-10 lg:grid-cols-[1fr_1.15fr]">
        <Suspense fallback={<div className="h-96 rounded-[20px] bg-surface" aria-busy="true" />}>
          <YourRating gameId={game.id} slug={game.slug} />
        </Suspense>
        <Suspense fallback={<div className="h-64 rounded-[20px] bg-surface" aria-busy="true" />}>
          <ReviewList gameId={game.id} />
        </Suspense>
      </section>
    </>
  );
}

async function YourRating({ gameId, slug }: { gameId: number; slug: string }) {
  const [user, t] = await Promise.all([getCurrentUser(), getTranslations("rating")]);
  if (!user) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-[20px] bg-surface p-6 sm:p-7">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-soft">{t("signInToRate")}</p>
        <Link
          href={`/login?next=${encodeURIComponent(`/games/${slug}`)}`}
          className="flex h-12 items-center rounded-xl bg-accent px-6 font-bold text-accent-ink btn-pop"
        >
          {t("signInCta")}
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("ratings")
    .select("score, review, has_spoilers, hours_played, finished_on")
    .eq("user_id", user.id)
    .eq("game_id", gameId)
    .maybeSingle();

  const existing: ExistingRating | null = data
    ? {
        score: data.score,
        review: data.review,
        hasSpoilers: data.has_spoilers,
        hoursPlayed: data.hours_played === null ? null : Number(data.hours_played),
        finishedOn: data.finished_on,
      }
    : null;

  // Sin key: re-crear el formulario borraría el mensaje "Guardado". Al terminar
  // de guardar, React vuelve los campos a sus valores iniciales, que ya son los nuevos.
  return <RatingForm gameId={gameId} existing={existing} />;
}

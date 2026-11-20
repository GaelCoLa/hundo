// Tarjeta grande de la portada con un juego REAL: el mejor puntuado entre los
// más calificados del último mes (o el mejor de siempre). Si ningún juego tiene
// nota todavía, muestra la tarjeta de ejemplo. Datos públicos y cacheados por
// minutos: la portada se sigue pre-generando.
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ScoreRing } from "@/components/ScoreRing";
import { Cover } from "@/components/games/Cover";
import { Reveal } from "@/components/motion/Reveal";
import { getFeatured, getTopRated } from "@/lib/explore";
import { pickSpotlight } from "@/lib/spotlight";
import { coverUrl } from "@/lib/igdb/map";
import { getScaleCategory, SCALE } from "@/lib/scale";
import { ExampleCard } from "./ExampleCard";

export async function SpotlightCard() {
  const [featured, topRated] = await Promise.all([getFeatured(), getTopRated(null)]);
  const game = pickSpotlight(featured, topRated);
  if (!game || game.communityScore === null) return <ExampleCard />;

  const [t, ts] = await Promise.all([getTranslations("home"), getTranslations("scale")]);
  const category = getScaleCategory(game.communityScore);
  const backdrop = coverUrl(game.coverImageId, "t_cover_big");
  const meta = [game.releaseYear, game.genres[0]].filter(Boolean).join(", ");

  return (
    <Link
      href={`/games/${game.slug}`}
      className="group relative isolate block overflow-hidden rounded-[28px] bg-surface shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] transition hover:ring-2 hover:ring-accent"
    >
      {/* Fondo: la portada ampliada y difuminada (como en la ficha del juego). */}
      {backdrop ? (
        <Image src={backdrop} alt="" fill sizes="500px" className="-z-10 scale-150 object-cover opacity-40 blur-2xl saturate-150" />
      ) : null}
      <div className="flex flex-col gap-6 p-6 sm:p-7">
        <div className="flex items-start gap-5">
          <Cover imageId={game.coverImageId} name={game.name} size="t_cover_big" className="w-24 shrink-0 shadow-[0_12px_24px_-10px_rgba(0,0,0,0.8)]" />
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-[46px] font-black leading-[0.95] text-ink group-hover:text-accent">{game.name}</h2>
            <p className="flex flex-wrap items-center gap-2 text-sm text-soft">
              {meta}
              <span className="rounded-full bg-bg/60 px-3 py-1 text-xs font-semibold text-accent">{t("spotlight")}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <ScoreRing score={game.communityScore} innerColor="#141b30" trackColor="#2c3654" />
          <div className="flex flex-col gap-1">
            <span className="font-display text-[40px] font-black leading-none" style={{ color: category.color }}>
              {ts(category.key)}
            </span>
            <span className="text-sm text-soft">{t("communityScoreFrom", { count: game.validRatingsCount })}</span>
          </div>
        </div>
        <Reveal className="flex h-3 gap-[3px] overflow-hidden rounded-full bg-line" delay={0.4}>
          <div aria-hidden="true" className="contents">
            {SCALE.map((c, i) =>
              game.scoreDistribution[i] ? <div key={c.key} style={{ flex: game.scoreDistribution[i], background: c.color }} /> : null,
            )}
          </div>
        </Reveal>
      </div>
    </Link>
  );
}

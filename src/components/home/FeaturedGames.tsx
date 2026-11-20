// "Destacados" de la portada: los juegos más calificados del último mes,
// elegidos solos (sin selección manual). Datos públicos y cacheados: la
// portada se sigue pre-generando. Si todavía no hay ninguno, no se muestra.
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getScaleCategory } from "@/lib/scale";
import { getFeatured } from "@/lib/explore";
import { Cover } from "@/components/games/Cover";
import { TiltCard } from "@/components/motion/TiltCard";
import { StaggerItem, StaggerList } from "@/components/motion/Stagger";

export async function FeaturedGames() {
  const [t, ts, games] = await Promise.all([getTranslations("home"), getTranslations("scale"), getFeatured()]);
  if (games.length === 0) return null;

  return (
    <section aria-labelledby="featured" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="featured" className="font-display text-4xl font-black uppercase">
          {t("featuredTitle")}
        </h2>
        <span className="text-sm text-muted">{t("featuredHint")}</span>
      </div>
      <StaggerList className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {games.map((g) => {
          const category = g.communityScore !== null ? getScaleCategory(g.communityScore) : null;
          return (
            <StaggerItem key={g.id} className="flex flex-col gap-2">
              <Link href={`/games/${g.slug}`} className="group block rounded-xl">
                <TiltCard>
                  <Cover imageId={g.coverImageId} name={g.name} size="t_cover_big" className="transition-shadow duration-300 group-hover:shadow-[0_18px_36px_-14px_rgba(0,0,0,0.9)] group-hover:ring-2 group-hover:ring-accent" />
                </TiltCard>
              </Link>
              <span className="flex items-start justify-between gap-2">
                <Link href={`/games/${g.slug}`} className="line-clamp-2 font-semibold leading-tight hover:underline">
                  {g.name}
                </Link>
                {category ? (
                  <span
                    className="font-display text-2xl font-black leading-none"
                    style={{ color: category.color }}
                    aria-label={ts("ringLabel", { score: g.communityScore!, category: ts(category.key) })}
                  >
                    {g.communityScore}
                  </span>
                ) : (
                  <span className="shrink-0 text-xs text-muted" title={t("noScoreYet")}>
                    —
                  </span>
                )}
              </span>
            </StaggerItem>
          );
        })}
      </StaggerList>
    </section>
  );
}

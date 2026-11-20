// Portada, según la maqueta aprobada "Mix". La tarjeta de la derecha muestra el
// juego real mejor puntuado del mes (o un ejemplo si todavía no hay ninguno con
// nota). Abajo, destacados y las calificaciones reales más recientes.
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ScaleBar } from "@/components/ScaleBar";
import { RecentRatings } from "@/components/home/RecentRatings";
import { FeaturedGames } from "@/components/home/FeaturedGames";
import { FloatingCovers } from "@/components/home/FloatingCovers";
import { WordReveal } from "@/components/motion/WordReveal";
import { ExampleCard } from "@/components/home/ExampleCard";
import { SpotlightCard } from "@/components/home/SpotlightCard";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 pb-20 pt-6 sm:px-8 sm:pt-10">
      <section className="relative isolate grid items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
        {/* Manchas de luz de colores de la escala, difuminadas, que se mueven lento. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20">
          <div className="absolute -left-24 -top-24 size-[420px] animate-drift rounded-full bg-accent/15 blur-3xl motion-reduce:animate-none" />
          <div className="absolute right-0 top-10 size-[460px] animate-drift rounded-full bg-scale-masterpiece/20 blur-3xl [animation-delay:-6s] motion-reduce:animate-none" />
          <div className="absolute bottom-[-120px] left-1/3 size-[380px] animate-drift rounded-full bg-scale-excellent/15 blur-3xl [animation-delay:-12s] motion-reduce:animate-none" />
        </div>
        <div className="flex flex-col gap-6">
          <WordReveal
            text={t("title")}
            className="font-display text-[56px] font-black uppercase leading-[0.94] tracking-[-1px] sm:text-[76px] lg:text-[68px] xl:text-[76px]"
          />
          <p className="max-w-[480px] text-lg leading-relaxed text-soft sm:text-[19px]">{t("subtitle")}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/games" className="flex h-[52px] items-center rounded-xl bg-accent px-6 font-bold text-accent-ink btn-pop">
              {t("rate")}
            </Link>
            <Link href="/games" className="flex h-[52px] items-center rounded-xl border-2 border-line px-6 font-semibold btn-pop btn-pop-ghost">
              {t("browse")}
            </Link>
          </div>
        </div>

        <div className="relative isolate">
          <Suspense fallback={null}>
            <FloatingCovers />
          </Suspense>
          {/* Juego real mejor puntuado; mientras carga (o si no hay ninguno con nota), el ejemplo. */}
          <Suspense fallback={<ExampleCard />}>
            <SpotlightCard />
          </Suspense>
        </div>
      </section>

      {/* Lo único dinámico de la portada: el resto se pre-genera. Sin fallback visible
          para que no "salte" un hueco vacío cuando todavía no hay calificaciones. */}
      {/* Datos públicos cacheados: no dependen de quién mira. */}
      <Suspense fallback={null}>
        <FeaturedGames />
      </Suspense>

      <Suspense fallback={null}>
        <RecentRatings />
      </Suspense>

      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-4xl font-black uppercase">{t("scaleTitle")}</h2>
          <Link href="/how-scores-work" className="font-semibold text-accent underline underline-offset-4">
            {t("howItWorks")}
          </Link>
        </div>
        <ScaleBar />
      </section>
    </main>
  );
}

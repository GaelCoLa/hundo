// Portada, según la maqueta aprobada "Mix". La tarjeta de la derecha es un
// EJEMPLO (lo dice en pantalla). Abajo, las calificaciones reales más recientes.
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ScoreRing } from "@/components/ScoreRing";
import { ScaleBar } from "@/components/ScaleBar";
import { SCALE } from "@/lib/scale";
import { RecentRatings } from "@/components/home/RecentRatings";
import { FeaturedGames } from "@/components/home/FeaturedGames";
import { FloatingCovers } from "@/components/home/FloatingCovers";
import { WordReveal } from "@/components/motion/WordReveal";
import { Reveal } from "@/components/motion/Reveal";

// Distribución de ejemplo (porcentaje de jugadores por categoría) para la tarjeta.
const EXAMPLE_DISTRIBUTION = [2, 2, 3, 6, 9, 22, 56];

export default function HomePage() {
  const t = useTranslations("home");
  const ts = useTranslations("scale");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 pb-20 pt-6 sm:px-8 sm:pt-10">
      <section className="relative isolate grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        {/* Manchas de luz de colores de la escala, difuminadas, que se mueven lento. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20">
          <div className="absolute -left-24 -top-24 size-[420px] animate-drift rounded-full bg-accent/15 blur-3xl motion-reduce:animate-none" />
          <div className="absolute right-0 top-10 size-[460px] animate-drift rounded-full bg-scale-masterpiece/20 blur-3xl [animation-delay:-6s] motion-reduce:animate-none" />
          <div className="absolute bottom-[-120px] left-1/3 size-[380px] animate-drift rounded-full bg-scale-excellent/15 blur-3xl [animation-delay:-12s] motion-reduce:animate-none" />
        </div>
        <div className="flex flex-col gap-6">
          <WordReveal
            text={t("title")}
            className="font-display text-[56px] font-black uppercase leading-[0.94] tracking-[-1px] sm:text-[76px] lg:text-[84px]"
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
          <article className="flex flex-col gap-6 rounded-[28px] bg-[#5a1a1f] p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] sm:p-7">
            <div className="flex items-start gap-5">
              <div aria-hidden="true" className="h-32 w-24 shrink-0 rounded-lg bg-[#3a1014]" />
              <div className="flex flex-col gap-2">
                <h2 className="font-display text-[46px] font-black leading-[0.95] text-[#fbe6e3]">{t("exampleGame")}</h2>
                <p className="flex flex-wrap items-center gap-2 text-sm text-[#e9b9b3]">
                  {t("exampleMeta")}
                  <span className="rounded-full bg-[#3a1014] px-3 py-1 text-xs font-semibold">{t("example")}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <ScoreRing score={96} innerColor="#5a1a1f" trackColor="#3a1014" />
              <div className="flex flex-col gap-1">
                <span className="font-display text-[40px] font-black leading-none text-[#d9c2ff]">{ts("masterpiece")}</span>
                <span className="text-sm text-[#e9b9b3]">{t("communityScoreFrom", { count: "1,284" })}</span>
              </div>
            </div>
            <Reveal className="flex h-3 gap-[3px] overflow-hidden rounded-full" delay={0.4}>
              <div aria-hidden="true" className="contents">
                {SCALE.map((c, i) => (
                  <div key={c.key} style={{ flex: EXAMPLE_DISTRIBUTION[i], background: c.color }} />
                ))}
              </div>
            </Reveal>
          </article>
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

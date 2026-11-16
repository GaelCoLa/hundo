// Portada, según la maqueta aprobada "Mix". La tarjeta de la derecha es un
// EJEMPLO (lo dice en pantalla): las notas reales llegan en la Fase 2.
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ScoreRing } from "@/components/ScoreRing";
import { ScaleBar } from "@/components/ScaleBar";
import { SCALE } from "@/lib/scale";

// Distribución de ejemplo (porcentaje de jugadores por categoría) para la tarjeta.
const EXAMPLE_DISTRIBUTION = [2, 2, 3, 6, 9, 22, 56];

export default function HomePage() {
  const t = useTranslations("home");
  const ts = useTranslations("scale");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 pb-20 pt-6 sm:px-8 sm:pt-10">
      <section className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col gap-6">
          <h1 className="font-display text-[56px] font-black uppercase leading-[0.94] tracking-[-1px] sm:text-[76px] lg:text-[84px]">
            {t("title")}
          </h1>
          <p className="max-w-[480px] text-lg leading-relaxed text-soft sm:text-[19px]">{t("subtitle")}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/games" className="flex h-[52px] items-center rounded-xl bg-accent px-6 font-bold text-accent-ink">
              {t("rate")}
            </Link>
            <Link href="/games" className="flex h-[52px] items-center rounded-xl border-2 border-line px-6 font-semibold">
              {t("browse")}
            </Link>
          </div>
        </div>

        <article className="flex flex-col gap-6 rounded-[28px] bg-[#5a1a1f] p-6 sm:p-7">
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
          <div aria-hidden="true" className="flex h-3 gap-[3px] overflow-hidden rounded-full">
            {SCALE.map((c, i) => (
              <div key={c.key} style={{ flex: EXAMPLE_DISTRIBUTION[i], background: c.color }} />
            ))}
          </div>
        </article>
      </section>

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

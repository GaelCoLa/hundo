// Tarjeta de EJEMPLO de la portada (maqueta "Mix"): se muestra mientras ningún
// juego de Hundo tenga nota de la comunidad. Lo dice en pantalla ("Ejemplo").
import { useTranslations } from "next-intl";
import { ScoreRing } from "@/components/ScoreRing";
import { Cover } from "@/components/games/Cover";
import { Reveal } from "@/components/motion/Reveal";
import { SCALE } from "@/lib/scale";

// Distribución de ejemplo (porcentaje de jugadores por categoría).
const EXAMPLE_DISTRIBUTION = [2, 2, 3, 6, 9, 22, 56];
// Portada real de Resident Evil 2 (2019) en IGDB.
const EXAMPLE_COVER = "co1ir3";

export function ExampleCard() {
  const t = useTranslations("home");
  const ts = useTranslations("scale");
  return (
    <article className="flex flex-col gap-6 rounded-[28px] bg-[#5a1a1f] p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] sm:p-7">
      <div className="flex items-start gap-5">
        <Cover imageId={EXAMPLE_COVER} name={t("exampleGame")} size="t_cover_big" className="w-24 shrink-0 shadow-[0_12px_24px_-10px_rgba(0,0,0,0.8)]" />
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
  );
}

// Panel de estadísticas del perfil: la hoja "Resumen" de la planilla, en la web.
import { getTranslations } from "next-intl/server";
import { getScaleCategory, SCALE } from "@/lib/scale";
import type { ProfileStats } from "@/lib/profile-stats";

export async function StatsPanel({ stats }: { stats: ProfileStats }) {
  const [t, ts] = await Promise.all([getTranslations("profile"), getTranslations("scale")]);
  const avgColor = stats.average !== null ? getScaleCategory(Math.min(100, Math.max(1, Math.round(stats.average)))).color : undefined;
  const max = Math.max(1, ...Object.values(stats.byCategory));

  return (
    <section aria-labelledby="stats" className="grid gap-6 rounded-[28px] bg-surface p-6 sm:p-7 lg:grid-cols-[auto_1fr]">
      <h2 id="stats" className="sr-only">
        {t("statsTitle")}
      </h2>
      <dl className="grid grid-cols-3 gap-4 lg:grid-cols-1 lg:gap-5 lg:pr-8">
        <div className="flex flex-col">
          <dt className="order-2 text-sm text-muted">{t("average")}</dt>
          <dd className="order-1 font-display text-6xl font-black leading-none" style={{ color: avgColor }}>
            {stats.average ?? "—"}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="order-2 text-sm text-muted">{t("games")}</dt>
          <dd className="order-1 font-display text-5xl font-black leading-none">{stats.count}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="order-2 text-sm text-muted">{t("hours")}</dt>
          <dd className="order-1 font-display text-5xl font-black leading-none">{stats.totalHours}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-muted">{t("byCategory")}</h3>
        <ul className="flex flex-col gap-2">
          {[...SCALE].reverse().map((c) => {
            const n = stats.byCategory[c.key];
            return (
              <li key={c.key} className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-3 text-sm">
                <span className="font-semibold">{ts(c.key)}</span>
                <span aria-hidden="true" className="h-3 overflow-hidden rounded-full bg-bg">
                  <span className="block h-full rounded-full" style={{ width: `${(n / max) * 100}%`, background: c.color }} />
                </span>
                <span className="text-right tabular-nums text-soft">{n}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

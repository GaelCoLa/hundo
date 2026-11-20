// La tarjeta de la nota de la comunidad (maqueta "Mix"): anillo con la nota,
// su categoría, la distribución "cómo lo calificaron" y tres datos.
// Sin 5 votos válidos no hay nota: lo decimos en vez de mostrar un número engañoso.
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ScoreRing } from "@/components/ScoreRing";
import { getScaleCategory, SCALE } from "@/lib/scale";
import type { GameRow } from "@/lib/games";
import { Reveal } from "@/components/motion/Reveal";

const MIN_VOTES = 5;

export async function CommunityScoreCard({ game }: { game: GameRow }) {
  const t = await getTranslations("game");
  const ts = await getTranslations("scale");
  const total = game.scoreDistribution.reduce((a, b) => a + b, 0);

  return (
    <section
      aria-labelledby="community-score"
      // Semitransparente con desenfoque ("vidrio esmerilado"): toma el color del
      // fondo difuminado de la portada que tiene detrás.
      className="flex flex-col gap-6 rounded-[28px] bg-surface/60 p-6 ring-1 ring-white/10 backdrop-blur-xl sm:p-7"
    >
      <h2 id="community-score" className="text-sm font-semibold text-muted">
        {t("communityScore")}
      </h2>

      {game.communityScore !== null ? (
        <div className="flex flex-wrap items-center gap-6">
          <ScoreRing score={game.communityScore} />
          <div className="flex flex-col gap-1">
            <span
              className="font-display text-[40px] font-black leading-none"
              style={{ color: getScaleCategory(game.communityScore).color }}
            >
              {ts(getScaleCategory(game.communityScore).key)}
            </span>
            <span className="text-sm text-soft">{t("fromPlayers", { count: game.validRatingsCount })}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="font-display text-4xl font-black uppercase leading-none">{t("notEnough")}</p>
          <p className="text-sm text-soft">
            {t("needMore", { count: MIN_VOTES - game.validRatingsCount })}{" "}
            <Link href="/how-scores-work" className="font-semibold text-accent underline underline-offset-4">
              {t("why")}
            </Link>
          </p>
        </div>
      )}

      {total > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted">{t("howRated")}</span>
          <Reveal className="flex h-3 gap-[3px] overflow-hidden rounded-full bg-line" delay={0.3}>
            {SCALE.map((c, i) =>
              game.scoreDistribution[i] ? (
                <div key={c.key} style={{ flex: game.scoreDistribution[i], background: c.color }} title={`${ts(c.key)}: ${game.scoreDistribution[i]}`} />
              ) : null,
            )}
          </Reveal>
          {/* Versión en texto para lectores de pantalla. */}
          <ul className="sr-only">
            {SCALE.map((c, i) => (
              <li key={c.key}>{`${ts(c.key)}: ${game.scoreDistribution[i] ?? 0}`}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <dl className="grid grid-cols-3 gap-3">
        <Stat label={t("avgHours")} value={game.avgHours !== null ? `${game.avgHours} h` : "—"} />
        <Stat label={t("reviews")} value={String(game.reviewsCount)} />
        <Stat label={t("ratings")} value={String(game.ratingsCount)} />
      </dl>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[14px] bg-bg/50 px-3.5 py-3">
      <dt className="order-2 text-xs text-muted">{label}</dt>
      <dd className="order-1 font-display text-[28px] font-extrabold leading-none">{value}</dd>
    </div>
  );
}

// Reseñas de un juego, de la más reciente a la más vieja (en la Fase 3 se suma
// ordenar por "más útiles"). Las que tienen spoilers quedan tapadas: se abren
// con un clic (<details> funciona sin JavaScript y es accesible).
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getScaleCategory } from "@/lib/scale";

type ReviewRow = {
  id: string;
  score: number;
  review: string;
  has_spoilers: boolean;
  hours_played: number | string | null;
  finished_on: string | null;
  profiles: { username: string } | null;
};

export async function ReviewList({ gameId }: { gameId: number }) {
  const [t, format, supabase] = await Promise.all([getTranslations("game"), getFormatter(), createClient()]);
  const { data } = await supabase
    .from("ratings")
    .select("id, score, review, has_spoilers, hours_played, finished_on, profiles(username)")
    .eq("game_id", gameId)
    .not("review", "is", null)
    .order("updated_at", { ascending: false })
    .limit(20)
    .returns<ReviewRow[]>();

  const reviews = (data ?? []).filter((r) => r.review.trim() !== "");

  return (
    <section aria-labelledby="reviews" className="flex flex-col gap-5">
      <h2 id="reviews" className="font-display text-4xl font-black uppercase">
        {t("reviewsTitle")}
      </h2>
      {reviews.length === 0 ? (
        <p className="text-soft">{t("noReviews")}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {reviews.map((r) => {
            const category = getScaleCategory(r.score);
            const meta = [
              r.hours_played !== null ? t("hoursShort", { hours: Number(r.hours_played) }) : null,
              r.finished_on ? t("finished", { date: format.dateTime(new Date(`${r.finished_on}T12:00:00Z`), { month: "short", year: "numeric" }) }) : null,
            ].filter(Boolean);
            return (
              <li key={r.id}>
                <article className="flex flex-col gap-3 rounded-[20px] bg-surface p-6">
                  <header className="flex items-center gap-3.5">
                    <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-[14px] bg-accent font-bold uppercase text-accent-ink">
                      {r.profiles?.username[0] ?? "?"}
                    </span>
                    <div className="flex grow flex-col">
                      {r.profiles ? (
                        <Link href={`/u/${r.profiles.username}`} className="font-semibold hover:underline">
                          @{r.profiles.username}
                        </Link>
                      ) : null}
                      {meta.length > 0 ? <span className="text-sm text-muted">{meta.join(" · ")}</span> : null}
                    </div>
                    <span className="font-display text-[44px] font-black leading-none" style={{ color: category.color }}>
                      {r.score}
                    </span>
                  </header>
                  {r.has_spoilers ? (
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-semibold text-accent">{t("showSpoilers")}</summary>
                      <p className="mt-2 whitespace-pre-line leading-relaxed text-[#d3d8e6]">{r.review}</p>
                    </details>
                  ) : (
                    <p className="whitespace-pre-line leading-relaxed text-[#d3d8e6]">{r.review}</p>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

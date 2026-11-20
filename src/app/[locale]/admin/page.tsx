// Panel de moderación (/admin), solo para administradores. Para cualquier otra
// persona la página "no existe" (404): no revelamos que hay un panel.
// Muestra los reportes abiertos, del más viejo al más nuevo, con acciones.
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getScaleCategory } from "@/lib/scale";
import { dismissReport, hideReview, suspendUser } from "./actions";

type OpenReport = {
  report_id: string;
  rating_id: string;
  reason: string;
  details: string | null;
  created_at: string;
  reporter: string;
  author: string;
  author_id: string;
  author_suspended: boolean;
  review: string | null;
  is_hidden: boolean;
  score: number;
  game_slug: string;
  game_name: string;
  reports_on_rating: number;
};

type Moderated = {
  kind: "review" | "user";
  rating_id: string | null;
  user_id: string;
  username: string;
  review: string | null;
  score: number | null;
  game_slug: string | null;
  game_name: string | null;
};

export default function AdminPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 pb-20 pt-6 sm:px-8 sm:pt-10">
      <Suspense fallback={<div className="h-64 rounded-[20px] bg-surface" aria-busy="true" />}>
        <Panel />
      </Suspense>
    </main>
  );
}

async function Panel() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) notFound();
  const [t, tr, format, supabase] = await Promise.all([getTranslations("admin"), getTranslations("report"), getFormatter(), createClient()]);
  const [open, moderatedRes] = await Promise.all([supabase.rpc("open_reports"), supabase.rpc("moderated_content")]);
  if (open.error) console.error("open_reports failed", open.error.code, open.error.message);
  if (moderatedRes.error) console.error("moderated_content failed", moderatedRes.error.code, moderatedRes.error.message);
  const reports = (open.data ?? []) as OpenReport[];
  // Lo que está oculto o suspendido ahora: para poder deshacerlo.
  const moderated = (moderatedRes.data ?? []) as Moderated[];
  const action = "btn-pop btn-pop-ghost h-9 rounded-lg border-2 border-line px-3 text-sm font-semibold";

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-6xl font-black uppercase leading-[0.9]">{t("title")}</h1>
        <p className="text-soft">{t("pending", { count: reports.length })}</p>
      </header>

      {reports.length === 0 ? (
        <p className="rounded-[20px] bg-surface p-6 text-soft">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {reports.map((r) => (
            <li key={r.report_id}>
              <article className="flex flex-col gap-3 rounded-[20px] bg-surface p-6">
                <header className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-semibold text-scale-fair">
                    {tr(`reasons.${r.reason}`)}
                    {r.reports_on_rating > 1 ? ` · ${t("reportsCount", { count: r.reports_on_rating })}` : ""}
                  </span>
                  <span className="text-muted">
                    {t("reportedBy", { user: r.reporter })} ·{" "}
                    {format.dateTime(new Date(r.created_at), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </header>
                {r.details ? <p className="rounded-[10px] bg-bg p-3 text-sm italic text-soft">“{r.details}”</p> : null}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-muted">
                      <Link href={`/u/${r.author}`} className="font-semibold text-ink hover:underline">
                        @{r.author}
                      </Link>{" "}
                      {r.author_suspended ? <span className="text-scale-mediocre">({t("suspended")}) </span> : null}
                      {t("on")}{" "}
                      <Link href={`/games/${r.game_slug}`} className="font-semibold text-ink hover:underline">
                        {r.game_name}
                      </Link>
                      {r.is_hidden ? <span className="text-scale-mediocre"> · {t("hidden")}</span> : null}
                    </p>
                    <p className="whitespace-pre-line leading-relaxed text-[#d3d8e6]">{r.review}</p>
                  </div>
                  <span className="font-display text-4xl font-black" style={{ color: getScaleCategory(r.score).color }}>
                    {r.score}
                  </span>
                </div>
                <footer className="flex flex-wrap gap-2 pt-1">
                  <form action={hideReview.bind(null, r.rating_id, !r.is_hidden)}>
                    <button className={action}>{r.is_hidden ? t("unhide") : t("hide")}</button>
                  </form>
                  <form action={suspendUser.bind(null, r.author_id, !r.author_suspended)}>
                    <button className={`${action} ${r.author_suspended ? "" : "text-scale-mediocre"}`}>
                      {r.author_suspended ? t("unsuspend") : t("suspend")}
                    </button>
                  </form>
                  <form action={dismissReport.bind(null, r.report_id)}>
                    <button className={action}>{t("dismiss")}</button>
                  </form>
                </footer>
              </article>
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="moderated" className="flex flex-col gap-4">
        <h2 id="moderated" className="font-display text-4xl font-black uppercase">
          {t("moderatedTitle")}
        </h2>
        {moderated.length === 0 ? (
          <p className="text-soft">{t("moderatedEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {moderated.map((m) => (
              <li key={`${m.kind}-${m.rating_id ?? m.user_id}`} className="flex flex-wrap items-center gap-3 rounded-[14px] bg-surface p-4">
                <span className="grow text-sm">
                  {m.kind === "review" ? (
                    <>
                      <span className="text-scale-mediocre">{t("hiddenReview")}</span> · @{m.username} {t("on")}{" "}
                      <Link href={`/games/${m.game_slug}`} className="font-semibold hover:underline">
                        {m.game_name}
                      </Link>
                      <span className="mt-1 block truncate text-muted">{m.review}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-scale-mediocre">{t("suspendedUser")}</span> · @{m.username}
                    </>
                  )}
                </span>
                {m.kind === "review" ? (
                  <form action={hideReview.bind(null, m.rating_id!, false)}>
                    <button className={action}>{t("unhide")}</button>
                  </form>
                ) : (
                  <form action={suspendUser.bind(null, m.user_id, false)}>
                    <button className={action}>{t("unsuspend")}</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

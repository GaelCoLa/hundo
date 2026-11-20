// Página Jugadores: buscador de usuarios (?q=) y, sin búsqueda, dos rankings:
// "Top reviewers" (más "útil" recibidos) y "Más activos" (más calificaciones).
// Los rankings los calcula Postgres (función top_players, ver migraciones).
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { escapeLike, usernameQuery } from "@/lib/community";
import { PlayerRow, type PlayerSummary } from "@/components/community/PlayerRow";
import { StaggerItem, StaggerList } from "@/components/motion/Stagger";

type SearchParams = PageProps<"/[locale]/players">["searchParams"];

export default async function PlayersPage({ searchParams }: PageProps<"/[locale]/players">) {
  const t = await getTranslations("players");
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-20 pt-6 sm:px-8 sm:pt-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-6xl font-black uppercase leading-[0.9]">{t("title")}</h1>
        <p className="text-soft">{t("subtitle")}</p>
      </header>
      <Suspense fallback={<div className="h-96 rounded-[20px] bg-surface" aria-busy="true" />}>
        <Players searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Players({ searchParams }: { searchParams: SearchParams }) {
  const raw = (await searchParams).q;
  const q = (typeof raw === "string" ? raw : "").trim().slice(0, 20);
  const [t, supabase] = await Promise.all([getTranslations("players"), createClient()]);

  const searchForm = (
    // Formulario GET común: al enviar, el navegador va a /players?q=... (funciona sin JavaScript).
    <form role="search" className="flex gap-2">
      <label htmlFor="player-q" className="sr-only">
        {t("searchLabel")}
      </label>
      <input
        id="player-q"
        name="q"
        defaultValue={q}
        placeholder={t("searchPlaceholder")}
        maxLength={20}
        className="h-12 grow rounded-xl border border-line bg-surface px-4 text-ink placeholder:text-muted"
      />
      <button type="submit" className="btn-pop h-12 rounded-xl bg-accent px-6 font-bold text-accent-ink">
        {t("search")}
      </button>
    </form>
  );

  if (q !== "") {
    if (q.length < 2) {
      return (
        <>
          {searchForm}
          <p className="text-soft">{t("tooShort")}</p>
        </>
      );
    }
    // Solo letras, números y "_" (como los nombres de usuario): otro carácter no
    // puede coincidir, y "*" o "%" la API los tomaría como comodines.
    const term = usernameQuery(q);
    // Empieza con lo buscado. escapeLike: "_" se busca como texto, no como
    // comodín. "!ratings_user_id_fkey": las calificaciones propias (no las que
    // votó como "útil").
    const { data } = term === null ? { data: [] } : await supabase
      .from("profiles")
      .select("username, helpful_received, ratings!ratings_user_id_fkey(count)")
      .ilike("username", `${escapeLike(term ?? "")}%`)
      .order("username")
      .limit(20)
      .returns<{ username: string; helpful_received: number; ratings: { count: number }[] }[]>();
    const players: PlayerSummary[] = (data ?? []).map((p) => ({
      username: p.username,
      helpfulReceived: p.helpful_received,
      ratingsCount: p.ratings[0]?.count ?? 0,
    }));
    return (
      <>
        {searchForm}
        {players.length === 0 ? (
          <p className="text-soft">{t("noResults", { q })}</p>
        ) : (
          <StaggerList className="flex flex-col gap-2">
            {players.map((p) => (
              <StaggerItem key={p.username}>
                <PlayerRow player={p} />
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </>
    );
  }

  const [helpful, active] = await Promise.all([
    supabase.rpc("top_players", { p_order: "helpful", p_limit: 20 }),
    supabase.rpc("top_players", { p_order: "active", p_limit: 20 }),
  ]);
  type Row = { username: string; helpful_received: number; ratings_count: number };
  const toSummary = (rows: Row[] | null): PlayerSummary[] =>
    (rows ?? []).map((r) => ({ username: r.username, helpfulReceived: r.helpful_received, ratingsCount: r.ratings_count }));

  return (
    <>
      {searchForm}
      <div className="grid gap-10 lg:grid-cols-2">
        <Ranking title={t("topReviewers")} empty={t("emptyHelpful")} players={toSummary(helpful.data as Row[] | null)} />
        <Ranking title={t("mostActive")} empty={t("emptyActive")} players={toSummary(active.data as Row[] | null)} />
      </div>
    </>
  );
}

function Ranking({ title, empty, players }: { title: string; empty: string; players: PlayerSummary[] }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-3xl font-black uppercase">{title}</h2>
      {players.length === 0 ? (
        <p className="text-soft">{empty}</p>
      ) : (
        <StaggerList className="flex flex-col gap-2">
          {players.map((p, i) => (
            <StaggerItem key={p.username}>
              <PlayerRow player={p} rank={i + 1} />
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </section>
  );
}

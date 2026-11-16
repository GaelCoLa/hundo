// Perfil público: /u/<usuario>
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { computeProfileStats, sortLibrary, type LibrarySort } from "@/lib/profile-stats";
import { SCALE, getScaleCategory, type ScaleKey } from "@/lib/scale";
import { StatsPanel } from "@/components/profile/StatsPanel";
import { Library, type LibraryEntry } from "@/components/profile/Library";

type Props = PageProps<"/[locale]/u/[username]">;

const SORTS: LibrarySort[] = ["recent", "score", "hours", "finished"];

type RatingWithGame = {
  score: number;
  hours_played: number | string | null;
  finished_on: string | null;
  updated_at: string;
  games: { slug: string; name: string; cover_image_id: string | null } | null;
};

export default function ProfilePage(props: Props) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-20 pt-6 sm:px-8 sm:pt-10">
      <Suspense fallback={<div className="h-72 rounded-[28px] bg-surface" aria-busy="true" />}>
        <Profile {...props} />
      </Suspense>
    </main>
  );
}

async function Profile({ params, searchParams }: Props) {
  const [{ username }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();

  // Las reglas RLS ya ocultan los perfiles suspendidos: para el visitante "no existen".
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, created_at")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (!profile) notFound();

  const { data } = await supabase
    .from("ratings")
    .select("score, hours_played, finished_on, updated_at, games(slug, name, cover_image_id)")
    .eq("user_id", profile.id)
    .returns<RatingWithGame[]>();

  const all: LibraryEntry[] = (data ?? [])
    .filter((r) => r.games !== null)
    .map((r) => ({
      name: r.games!.name,
      slug: r.games!.slug,
      coverImageId: r.games!.cover_image_id,
      score: r.score,
      hoursPlayed: r.hours_played === null ? null : Number(r.hours_played),
      finishedOn: r.finished_on,
      updatedAt: r.updated_at,
    }));

  const sortParam = typeof query.sort === "string" ? query.sort : "";
  const sort: LibrarySort = (SORTS as string[]).includes(sortParam) ? (sortParam as LibrarySort) : "recent";
  const catParam = typeof query.cat === "string" ? query.cat : "";
  const cat = SCALE.some((c) => c.key === catParam) ? (catParam as ScaleKey) : null;
  const items = sortLibrary(cat ? all.filter((i) => getScaleCategory(i.score).key === cat) : all, sort);

  const t = await getTranslations("profile");

  return (
    <>
      <header className="flex items-center gap-5">
        <span aria-hidden="true" className="flex size-20 items-center justify-center rounded-[22px] bg-accent font-display text-5xl font-black uppercase text-accent-ink">
          {profile.username[0]}
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-5xl font-black leading-none sm:text-6xl">@{profile.username}</h1>
          <p className="text-sm text-muted">{t("memberSince", { date: new Date(profile.created_at) })}</p>
        </div>
      </header>
      <StatsPanel stats={computeProfileStats(all)} />
      <Library username={profile.username} items={items} sort={sort} cat={cat} />
    </>
  );
}

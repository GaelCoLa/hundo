// Perfil público: /u/<usuario>
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { isTopReviewer } from "@/lib/community";
import { Link } from "@/i18n/navigation";
import { TopReviewerBadge } from "@/components/community/TopReviewerBadge";
import { FollowButton } from "@/components/community/FollowButton";
import { Avatar } from "@/components/Avatar";
import { Favorites, type FavoriteEntry } from "@/components/profile/Favorites";
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
    .select("id, username, created_at, helpful_received, display_name, bio, avatar_url")
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

  // Top 5: la nota de cada favorito sale de las calificaciones ya cargadas.
  const { data: favRows } = await supabase
    .from("favorites")
    .select("position, games(slug, name, cover_image_id)")
    .eq("user_id", profile.id)
    .order("position")
    .returns<{ position: number; games: { slug: string; name: string; cover_image_id: string | null } | null }[]>();
  const scoreBySlug = new Map(all.map((e) => [e.slug, e.score]));
  const favorites: FavoriteEntry[] = (favRows ?? [])
    .filter((f) => f.games)
    .map((f) => ({ position: f.position, slug: f.games!.slug, name: f.games!.name, coverImageId: f.games!.cover_image_id, score: scoreBySlug.get(f.games!.slug) ?? null }));

  const sortParam = typeof query.sort === "string" ? query.sort : "";
  const sort: LibrarySort = (SORTS as string[]).includes(sortParam) ? (sortParam as LibrarySort) : "recent";
  const catParam = typeof query.cat === "string" ? query.cat : "";
  const cat = SCALE.some((c) => c.key === catParam) ? (catParam as ScaleKey) : null;
  const items = sortLibrary(cat ? all.filter((i) => getScaleCategory(i.score).key === cat) : all, sort);

  const [t, tc, viewer] = await Promise.all([getTranslations("profile"), getTranslations("community"), getCurrentUser()]);

  // Seguidores y seguidos: "head: true" pide solo la cantidad, sin las filas.
  const [followers, followingCount, viewerFollows] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("followee_id", profile.id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
    viewer && viewer.id !== profile.id
      ? supabase.from("follows").select("followee_id").eq("follower_id", viewer.id).eq("followee_id", profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const followerCount = followers.count ?? 0;

  return (
    <>
      <header className="flex flex-wrap items-center gap-5">
        <Avatar username={profile.username} ownerId={profile.id} avatarPath={profile.avatar_url} size={80} className="rounded-[22px] font-display text-5xl font-black" />
        <div className="flex grow flex-col gap-1">
          {profile.display_name ? <p className="text-lg font-semibold text-soft">{profile.display_name}</p> : null}
          <h1 className="font-display text-5xl font-black leading-none sm:text-6xl">@{profile.username}</h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            {t("memberSince", { date: new Date(profile.created_at) })}
            {isTopReviewer(profile.helpful_received) ? <TopReviewerBadge /> : null}
          </p>
          <Link href={`/u/${profile.username}/following`} className="self-start text-sm text-soft hover:text-ink hover:underline">
            {tc("followingCount", { count: followingCount.count ?? 0 })}
          </Link>
          {profile.bio ? <p className="max-w-prose whitespace-pre-line pt-1 leading-relaxed text-[#d3d8e6]">{profile.bio}</p> : null}
        </div>
        {viewer && viewer.id === profile.id ? (
          // Tu propio perfil: en vez de "Seguir", un atajo a Configuración.
          <div className="flex items-center gap-4">
            <Link href={`/u/${profile.username}/followers`} className="text-sm text-soft hover:text-ink hover:underline">
              <strong className="font-display text-2xl font-black text-ink">{followerCount}</strong> {tc("followers", { count: followerCount })}
            </Link>
            <Link href="/settings" className="btn-pop btn-pop-ghost flex h-10 items-center gap-2 rounded-xl border-2 border-line px-4 font-semibold">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              {t("editProfile")}
            </Link>
          </div>
        ) : viewer ? (
          <FollowButton followeeId={profile.id} following={viewerFollows.data !== null} followers={followerCount} followersHref={`/u/${profile.username}/followers`} />
        ) : (
          <div className="flex items-center gap-4">
            <Link href={`/u/${profile.username}/followers`} className="text-sm text-soft hover:text-ink hover:underline">
              <strong className="font-display text-2xl font-black text-ink">{followerCount}</strong> {tc("followers", { count: followerCount })}
            </Link>
            <Link href={`/login?next=${encodeURIComponent(`/u/${profile.username}`)}`} className="btn-pop flex h-10 items-center rounded-xl bg-accent px-5 font-bold text-accent-ink">
              {tc("follow")}
            </Link>
          </div>
        )}
      </header>
      <Favorites items={favorites} />
      <StatsPanel stats={computeProfileStats(all)} />
      <Library username={profile.username} items={items} sort={sort} cat={cat} />
    </>
  );
}

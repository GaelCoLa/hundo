// Lista de seguidores o de seguidos de un jugador, con links a cada perfil.
// La usan /u/<usuario>/followers y /u/<usuario>/following.
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isTopReviewer } from "@/lib/community";
import { Avatar } from "@/components/Avatar";
import { TopReviewerBadge } from "@/components/community/TopReviewerBadge";
import { StaggerItem, StaggerList } from "@/components/motion/Stagger";

type Person = { id: string; username: string; display_name: string | null; avatar_url: string | null; helpful_received: number };

export async function FollowList({ username, kind }: { username: string; kind: "followers" | "following" }) {
  const [t, supabase] = await Promise.all([getTranslations("follows"), createClient()]);

  // RLS ya oculta los perfiles suspendidos: para el visitante "no existen".
  const { data: profile } = await supabase.from("profiles").select("id, username").eq("username", username.toLowerCase()).maybeSingle();
  if (!profile) notFound();

  // follows tiene DOS claves foráneas hacia profiles (quien sigue y a quién):
  // el "!follows_..._fkey" elige cuál de las dos personas traer.
  const select =
    kind === "followers"
      ? "created_at, person:profiles!follows_follower_id_fkey(id, username, display_name, avatar_url, helpful_received)"
      : "created_at, person:profiles!follows_followee_id_fkey(id, username, display_name, avatar_url, helpful_received)";
  const { data, error } = await supabase
    .from("follows")
    .select(select)
    .eq(kind === "followers" ? "followee_id" : "follower_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<{ created_at: string; person: Person | null }[]>();
  if (error) console.error("FollowList failed", error.code, error.message);
  // Suspendidos: el perfil viene null (RLS); no se muestran.
  const people = (data ?? []).map((r) => r.person).filter((p): p is Person => p !== null);

  const tab = (active: boolean) =>
    `relative rounded-full px-3 py-1.5 text-sm font-semibold ${active ? "bg-ink text-bg" : "bg-surface text-soft hover:text-ink"}`;

  return (
    <>
      <header className="flex flex-col gap-3">
        <Link href={`/u/${profile.username}`} className="self-start text-sm font-semibold text-accent hover:underline">
          ← @{profile.username}
        </Link>
        <h1 className="font-display text-5xl font-black uppercase leading-[0.9]">{t(kind === "followers" ? "followersTitle" : "followingTitle")}</h1>
        <nav aria-label={t("tabs")} className="flex gap-2">
          <Link href={`/u/${profile.username}/followers`} aria-current={kind === "followers" ? "page" : undefined} className={tab(kind === "followers")}>
            {t("followersTab")}
          </Link>
          <Link href={`/u/${profile.username}/following`} aria-current={kind === "following" ? "page" : undefined} className={tab(kind === "following")}>
            {t("followingTab")}
          </Link>
        </nav>
      </header>

      {people.length === 0 ? (
        <p className="rounded-[20px] bg-surface p-6 text-soft">{t(kind === "followers" ? "noFollowers" : "noFollowing", { username: profile.username })}</p>
      ) : (
        <StaggerList className="flex flex-col gap-2">
          {people.map((p) => (
            <StaggerItem key={p.id}>
              <Link
                href={`/u/${p.username}`}
                className="flex items-center gap-4 rounded-[14px] bg-surface p-3 transition duration-200 hover:translate-x-1 hover:ring-2 hover:ring-line"
              >
                <Avatar username={p.username} ownerId={p.id} avatarPath={p.avatar_url} size={44} />
                <span className="flex min-w-0 grow flex-col">
                  {p.display_name ? <span className="truncate text-sm text-soft">{p.display_name}</span> : null}
                  <span className="flex flex-wrap items-center gap-2 font-semibold">
                    @{p.username}
                    {isTopReviewer(p.helpful_received) ? <TopReviewerBadge /> : null}
                  </span>
                </span>
              </Link>
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </>
  );
}

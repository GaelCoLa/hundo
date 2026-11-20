// Lectura de reseñas para la ficha del juego y la página Reseñas: la misma
// consulta y la misma forma de datos en los dos lugares.
import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { ReviewSort } from "@/lib/community";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type ReviewData = {
  id: string;
  score: number;
  review: string;
  hasSpoilers: boolean;
  hoursPlayed: number | null;
  finishedOn: string | null;
  helpfulCount: number;
  author: { id: string; username: string; helpfulReceived: number; avatarUrl: string | null } | null;
  game: { slug: string; name: string; coverImageId: string | null } | null;
};

type Row = {
  id: string;
  score: number;
  review: string;
  has_spoilers: boolean;
  hours_played: number | string | null;
  finished_on: string | null;
  helpful_count: number;
  profiles: { id: string; username: string; helpful_received: number; avatar_url: string | null } | null;
  games: { slug: string; name: string; cover_image_id: string | null } | null;
};

// Columnas que se piden: la reseña, su autor y su juego (Supabase arma el join
// por las claves foráneas). "!ratings_user_id_fkey" elige el camino: desde que
// existe review_likes hay DOS formas de llegar de ratings a profiles (el autor,
// o quienes votaron "útil"), y sin aclararlo Supabase no sabe cuál usar.
const SELECT =
  "id, score, review, has_spoilers, hours_played, finished_on, helpful_count, profiles!ratings_user_id_fkey(id, username, helpful_received, avatar_url), games(slug, name, cover_image_id)";

/**
 * Reseñas visibles (con texto), en el orden pedido. El filtro de "sin texto"
 * va en SQL, antes del límite: así siempre llegan hasta `limit` reseñas reales.
 * (RLS ya deja afuera las ocultas y las de cuentas suspendidas.)
 */
export async function fetchReviews(
  supabase: Supabase,
  opts: { sort: ReviewSort; gameId?: number; from: number; limit: number },
): Promise<ReviewData[]> {
  let query = supabase.from("ratings").select(SELECT).not("review", "is", null).neq("review", "");
  if (opts.gameId !== undefined) query = query.eq("game_id", opts.gameId);
  query =
    opts.sort === "helpful"
      ? query.order("helpful_count", { ascending: false }).order("updated_at", { ascending: false })
      : query.order("updated_at", { ascending: false });
  const { data, error } = await query.range(opts.from, opts.from + opts.limit - 1).returns<Row[]>();
  if (error) console.error("fetchReviews failed", error.code, error.message);

  return (data ?? []).map((r) => ({
    id: r.id,
    score: r.score,
    review: r.review,
    hasSpoilers: r.has_spoilers,
    hoursPlayed: r.hours_played === null ? null : Number(r.hours_played),
    finishedOn: r.finished_on,
    helpfulCount: r.helpful_count,
    author: r.profiles ? { id: r.profiles.id, username: r.profiles.username, helpfulReceived: r.profiles.helpful_received, avatarUrl: r.profiles.avatar_url } : null,
    game: r.games ? { slug: r.games.slug, name: r.games.name, coverImageId: r.games.cover_image_id } : null,
  }));
}

/** Cuáles de estas reseñas ya marcó como "útil" quien está mirando. */
export async function fetchViewerLikes(supabase: Supabase, viewerId: string | null, ratingIds: string[]): Promise<Set<string>> {
  if (!viewerId || ratingIds.length === 0) return new Set();
  const { data } = await supabase.from("review_likes").select("rating_id").eq("user_id", viewerId).in("rating_id", ratingIds);
  return new Set((data ?? []).map((l) => l.rating_id as string));
}

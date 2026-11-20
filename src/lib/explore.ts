// Consultas públicas de Explorar (rankings, géneros, puesto en el género).
// "use cache" + cacheLife("minutes"): la base se consulta como mucho cada pocos
// minutos por cada combinación de parámetros, aunque entren miles de visitas.
// Si algo falla devuelven una lista vacía (la página muestra su estado vacío).
import "server-only";
import { cacheLife } from "next/cache";
import { createPublicClient } from "@/lib/public-db";
import { GAME_COLUMNS, gameRowFromDb, type GameRecord, type GameRow } from "@/lib/games";

const LIMIT = 20;

/** Mejor puntuados (solo juegos con nota: 5 o más votos válidos), opcionalmente de un género. */
export async function getTopRated(genre: string | null): Promise<GameRow[]> {
  "use cache";
  cacheLife("minutes");
  let q = createPublicClient().from("games").select(GAME_COLUMNS).gte("valid_ratings_count", 5).not("community_score", "is", null);
  if (genre) q = q.contains("genres", [genre]);
  const { data, error } = await q
    .order("community_score", { ascending: false })
    .order("valid_ratings_count", { ascending: false })
    .limit(LIMIT)
    .returns<GameRecord[]>();
  if (error) console.error("getTopRated failed", error.code, error.message);
  return (data ?? []).map(gameRowFromDb);
}

/** Juegos con más reseñas escritas. */
export async function getMostReviewed(): Promise<GameRow[]> {
  "use cache";
  cacheLife("minutes");
  const { data, error } = await createPublicClient()
    .from("games")
    .select(GAME_COLUMNS)
    .gt("reviews_count", 0)
    .order("reviews_count", { ascending: false })
    .order("community_score", { ascending: false, nullsFirst: false })
    .limit(LIMIT)
    .returns<GameRecord[]>();
  if (error) console.error("getMostReviewed failed", error.code, error.message);
  return (data ?? []).map(gameRowFromDb);
}

/** Géneros con al menos un juego con nota (función SQL list_genres). */
export async function getGenres(): Promise<{ genre: string; games: number }[]> {
  "use cache";
  cacheLife("minutes");
  const { data, error } = await createPublicClient().rpc("list_genres");
  if (error) console.error("getGenres failed", error.code, error.message);
  return (data ?? []) as { genre: string; games: number }[];
}

/** Puesto del juego en su primer género, o null si no tiene nota o géneros. */
export async function getGenreRank(gameId: number): Promise<{ genre: string; position: number; total: number } | null> {
  "use cache";
  cacheLife("minutes");
  const { data, error } = await createPublicClient().rpc("genre_rank", { p_game_id: gameId });
  if (error) console.error("getGenreRank failed", error.code, error.message);
  const row = (data as { genre: string; position: number; total: number }[] | null)?.[0];
  return row ?? null;
}

/** Destacados de la portada: los más calificados en los últimos 30 días (función featured_games). */
export async function getFeatured(): Promise<GameRow[]> {
  "use cache";
  cacheLife("minutes");
  const { data, error } = await createPublicClient().rpc("featured_games", { p_limit: 6 });
  if (error) console.error("getFeatured failed", error.code, error.message);
  return ((data ?? []) as GameRecord[]).map(gameRowFromDb);
}

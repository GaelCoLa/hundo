// Lógica de la copia local de juegos. Es "pura": recibe sus dependencias
// (leer la base, pedir a IGDB, guardar) como parámetros. Así se puede probar
// con versiones falsas, sin base de datos ni internet. Las dependencias reales
// están en games-server.ts.
import type { IgdbGame } from "./igdb/map";

export type GameRow = IgdbGame & {
  igdbSyncedAt: Date;
  communityScore: number | null;
  validRatingsCount: number;
  ratingsCount: number;
  reviewsCount: number;
  avgHours: number | null;
  scoreDistribution: number[];
};

export type GameDeps = {
  readBySlug(slug: string): Promise<GameRow | null>;
  fetchFromIgdb(slug: string): Promise<IgdbGame | null>;
  /** Guarda los datos de IGDB sin tocar las columnas de estadísticas. */
  upsert(game: IgdbGame, syncedAt: Date): Promise<GameRow>;
  now(): Date;
};

/** Fila tal como la devuelve Supabase (nombres de Postgres en snake_case). */
export type GameRecord = {
  id: number;
  slug: string;
  name: string;
  cover_image_id: string | null;
  release_year: number | null;
  genres: string[];
  developers: string[];
  summary: string | null;
  igdb_synced_at: string;
  community_score: number | null;
  valid_ratings_count: number;
  ratings_count: number;
  reviews_count: number;
  avg_hours: number | string | null; // numeric de Postgres puede llegar como texto
  score_distribution: number[];
};

export const GAME_COLUMNS =
  "id, slug, name, cover_image_id, release_year, genres, developers, summary, igdb_synced_at, community_score, valid_ratings_count, ratings_count, reviews_count, avg_hours, score_distribution";

export function gameRowFromDb(r: GameRecord): GameRow {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    coverImageId: r.cover_image_id,
    releaseYear: r.release_year,
    genres: r.genres,
    developers: r.developers,
    summary: r.summary,
    igdbSyncedAt: new Date(r.igdb_synced_at),
    communityScore: r.community_score,
    validRatingsCount: r.valid_ratings_count,
    ratingsCount: r.ratings_count,
    reviewsCount: r.reviews_count,
    avgHours: r.avg_hours === null ? null : Number(r.avg_hours),
    scoreDistribution: r.score_distribution,
  };
}

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function isStale(syncedAt: Date, now: Date): boolean {
  return now.getTime() - syncedAt.getTime() > MAX_AGE_MS;
}

export async function getOrSyncGame(slug: string, deps: GameDeps): Promise<GameRow | null> {
  const cached = await deps.readBySlug(slug);
  if (cached && !isStale(cached.igdbSyncedAt, deps.now())) return cached;

  try {
    const fresh = await deps.fetchFromIgdb(slug);
    if (!fresh) return cached;
    return await deps.upsert(fresh, deps.now());
  } catch (error) {
    // IGDB caído o lento: mejor mostrar la copia vieja que un error.
    console.error("IGDB sync failed for", slug, error);
    return cached;
  }
}

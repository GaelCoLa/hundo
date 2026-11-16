// Las dependencias REALES de getOrSyncGame: Supabase para leer y guardar,
// IGDB para traer datos nuevos.
import "server-only";
import { getGameBySlug } from "./igdb/client";
import type { IgdbGame } from "./igdb/map";
import { createAdminClient } from "./supabase/admin";
import { GAME_COLUMNS, gameRowFromDb, getOrSyncGame, type GameDeps, type GameRecord, type GameRow } from "./games";

const realDeps: GameDeps = {
  async readBySlug(slug) {
    const { data, error } = await createAdminClient()
      .from("games")
      .select(GAME_COLUMNS)
      .eq("slug", slug)
      .maybeSingle<GameRecord>();
    if (error) throw error;
    return data ? gameRowFromDb(data) : null;
  },

  fetchFromIgdb: getGameBySlug,

  async upsert(game: IgdbGame, syncedAt: Date) {
    // Solo columnas de IGDB: las de estadísticas las mantiene Postgres.
    const { data, error } = await createAdminClient()
      .from("games")
      .upsert(
        {
          id: game.id,
          slug: game.slug,
          name: game.name,
          cover_image_id: game.coverImageId,
          release_year: game.releaseYear,
          genres: game.genres,
          developers: game.developers,
          summary: game.summary,
          igdb_synced_at: syncedAt.toISOString(),
        },
        { onConflict: "id" },
      )
      .select(GAME_COLUMNS)
      .single<GameRecord>();
    if (error) throw error;
    return gameRowFromDb(data);
  },

  now: () => new Date(),
};

/** Devuelve el juego desde nuestra base, trayéndolo o refrescándolo de IGDB si hace falta. */
export function getGame(slug: string): Promise<GameRow | null> {
  return getOrSyncGame(slug, realDeps);
}

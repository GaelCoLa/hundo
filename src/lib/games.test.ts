import { describe, expect, test, vi } from "vitest";
import { gameRowFromDb, getOrSyncGame, isStale, type GameDeps, type GameRow } from "@/lib/games";

describe("gameRowFromDb", () => {
  test("convierte la fila de Postgres (snake_case, numeric como texto)", () => {
    const g = gameRowFromDb({
      id: 113112,
      slug: "hades--1",
      name: "Hades",
      cover_image_id: null,
      release_year: 2020,
      genres: ["Indie"],
      developers: [],
      summary: null,
      igdb_synced_at: "2026-11-17T12:00:00+00:00",
      community_score: null,
      valid_ratings_count: 3,
      ratings_count: 4,
      reviews_count: 1,
      avg_hours: "40.5",
      score_distribution: [0, 0, 0, 0, 1, 1, 1],
    });
    expect(g.igdbSyncedAt.toISOString()).toBe("2026-11-17T12:00:00.000Z");
    expect(g.avgHours).toBe(40.5);
    expect(g.communityScore).toBeNull();
    expect(g.coverImageId).toBeNull();
    expect(g.scoreDistribution).toEqual([0, 0, 0, 0, 1, 1, 1]);
  });
});
import type { IgdbGame } from "@/lib/igdb/map";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-11-17T12:00:00Z");

describe("isStale", () => {
  test("29 días: todavía fresco", () => {
    expect(isStale(new Date(NOW.getTime() - 29 * DAY), NOW)).toBe(false);
  });
  test("exactamente 30 días: fresco", () => {
    expect(isStale(new Date(NOW.getTime() - 30 * DAY), NOW)).toBe(false);
  });
  test("30 días y 1 segundo: hay que refrescar", () => {
    expect(isStale(new Date(NOW.getTime() - 30 * DAY - 1000), NOW)).toBe(true);
  });
});

const igdbHades: IgdbGame = {
  id: 113112,
  slug: "hades--1",
  name: "Hades",
  coverImageId: "co39vc",
  releaseYear: 2020,
  genres: ["Indie"],
  developers: ["Supergiant Games"],
  summary: "Underworld",
};

function row(syncedDaysAgo: number, name = "Hades"): GameRow {
  return {
    ...igdbHades,
    name,
    igdbSyncedAt: new Date(NOW.getTime() - syncedDaysAgo * DAY),
    communityScore: 92,
    validRatingsCount: 7,
    ratingsCount: 8,
    reviewsCount: 3,
    avgHours: 40.5,
    scoreDistribution: [0, 0, 0, 1, 1, 3, 2],
  };
}

function deps(overrides: Partial<GameDeps>): GameDeps {
  return {
    readBySlug: vi.fn(async () => null),
    fetchFromIgdb: vi.fn(async () => igdbHades),
    upsert: vi.fn(async (g: IgdbGame, syncedAt: Date) => ({ ...row(0), ...g, igdbSyncedAt: syncedAt })),
    now: () => NOW,
    ...overrides,
  };
}

describe("getOrSyncGame", () => {
  test("juego nuevo: lo pide a IGDB y lo guarda", async () => {
    const d = deps({});
    const game = await getOrSyncGame("hades--1", d);
    expect(d.fetchFromIgdb).toHaveBeenCalledWith("hades--1");
    expect(d.upsert).toHaveBeenCalledWith(igdbHades, NOW);
    expect(game?.name).toBe("Hades");
  });

  test("copia fresca: no consulta a IGDB", async () => {
    const d = deps({ readBySlug: vi.fn(async () => row(5)) });
    const game = await getOrSyncGame("hades--1", d);
    expect(d.fetchFromIgdb).not.toHaveBeenCalled();
    expect(d.upsert).not.toHaveBeenCalled();
    expect(game?.communityScore).toBe(92);
  });

  test("copia vieja: la actualiza desde IGDB", async () => {
    const d = deps({ readBySlug: vi.fn(async () => row(40, "Old name")) });
    const game = await getOrSyncGame("hades--1", d);
    expect(d.fetchFromIgdb).toHaveBeenCalled();
    expect(game?.name).toBe("Hades");
  });

  test("copia vieja y IGDB caído: muestra la copia vieja", async () => {
    const d = deps({
      readBySlug: vi.fn(async () => row(40, "Old name")),
      fetchFromIgdb: vi.fn(async () => {
        throw new Error("IGDB down");
      }),
    });
    const game = await getOrSyncGame("hades--1", d);
    expect(game?.name).toBe("Old name");
    expect(d.upsert).not.toHaveBeenCalled();
  });

  test("no existe ni en la base ni en IGDB: null", async () => {
    const d = deps({ fetchFromIgdb: vi.fn(async () => null) });
    expect(await getOrSyncGame("no-existe", d)).toBeNull();
    expect(d.upsert).not.toHaveBeenCalled();
  });

  test("no existe en la base e IGDB caído: null", async () => {
    const d = deps({
      fetchFromIgdb: vi.fn(async () => {
        throw new Error("IGDB down");
      }),
    });
    expect(await getOrSyncGame("hades--1", d)).toBeNull();
  });
});

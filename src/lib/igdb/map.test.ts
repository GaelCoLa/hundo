import { describe, expect, test } from "vitest";
import hades from "./__fixtures__/hades.json";
import { coverUrl, mapIgdbGame } from "@/lib/igdb/map";

describe("mapIgdbGame", () => {
  test("convierte una respuesta completa de IGDB", () => {
    const game = mapIgdbGame(hades);
    expect(game).not.toBeNull();
    expect(game!.id).toBe(hades.id);
    expect(game!.slug).toBe(hades.slug);
    expect(game!.name).toBe("Hades");
    expect(game!.releaseYear).toBe(2020);
    expect(game!.coverImageId).toBe("co39vc");
    expect(game!.genres).toContain("Role-playing (RPG)");
    // Solo desarrolladores, no los demás estudios involucrados.
    expect(game!.developers).toEqual(["Supergiant Games"]);
    expect(game!.summary).toMatch(/Underworld/);
  });

  test("tolera juegos sin portada, fecha, géneros ni estudios", () => {
    expect(mapIgdbGame({ id: 1, slug: "x", name: "X" })).toEqual({
      id: 1,
      slug: "x",
      name: "X",
      coverImageId: null,
      releaseYear: null,
      genres: [],
      developers: [],
      summary: null,
    });
  });

  test.each([{ slug: "x" }, { id: 1, name: "X" }, { id: 1, slug: "x" }, null, "texto", 42])(
    "devuelve null si faltan datos obligatorios: %j",
    (raw) => {
      expect(mapIgdbGame(raw)).toBeNull();
    },
  );
});

describe("coverUrl", () => {
  test("arma la URL de la portada", () => {
    expect(coverUrl("co1abc", "t_cover_big")).toBe(
      "https://images.igdb.com/igdb/image/upload/t_cover_big/co1abc.jpg",
    );
    expect(coverUrl("co1abc", "t_cover_small")).toBe(
      "https://images.igdb.com/igdb/image/upload/t_cover_small/co1abc.jpg",
    );
  });

  test("sin imagen devuelve null", () => {
    expect(coverUrl(null, "t_cover_big")).toBeNull();
  });
});

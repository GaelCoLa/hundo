import { describe, expect, test } from "vitest";
import { escapeLike, isTopReviewer, pickGenre, parseBefore, parsePage, parseReviewSort, TOP_REVIEWER_MIN } from "@/lib/community";

describe("isTopReviewer", () => {
  test("hacen falta 50 'útil' recibidos (spec §5.3)", () => {
    expect(TOP_REVIEWER_MIN).toBe(50);
    expect(isTopReviewer(49)).toBe(false);
    expect(isTopReviewer(50)).toBe(true);
    expect(isTopReviewer(0)).toBe(false);
  });
});

describe("parseReviewSort", () => {
  test("solo 'recent' cambia el orden; todo lo demás es 'más útiles'", () => {
    expect(parseReviewSort("recent")).toBe("recent");
    expect(parseReviewSort("helpful")).toBe("helpful");
    expect(parseReviewSort(undefined)).toBe("helpful");
    expect(parseReviewSort(["recent"])).toBe("helpful");
    expect(parseReviewSort("x")).toBe("helpful");
  });
});

describe("parsePage", () => {
  test("número de página válido, entre 1 y 500", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-2")).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("2.5")).toBe(1);
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("9999")).toBe(500);
  });
});

describe("parseBefore", () => {
  test("cursor del feed: una fecha ISO válida, o null", () => {
    expect(parseBefore("2026-11-20T10:00:00.000Z")).toBe("2026-11-20T10:00:00.000Z");
    expect(parseBefore("2026-11-20")).toBe("2026-11-20T00:00:00.000Z");
    expect(parseBefore("hola")).toBeNull();
    expect(parseBefore("")).toBeNull();
    expect(parseBefore(undefined)).toBeNull();
    expect(parseBefore(["x"])).toBeNull();
  });
});

describe("escapeLike", () => {
  test("los comodines de LIKE (% _ y la barra invertida) se buscan como texto literal", () => {
    expect(escapeLike("gael")).toBe("gael");
    // String.raw: las barras invertidas se escriben tal cual (sin escapar en JS).
    expect(escapeLike("50%")).toBe(String.raw`50\%`);
    expect(escapeLike("a_b")).toBe(String.raw`a\_b`);
    expect(escapeLike(String.raw`x\y`)).toBe(String.raw`x\\y`);
    expect(escapeLike(String.raw`%_\ `.trim())).toBe(String.raw`\%\_\\`);
  });
});

describe("pickGenre", () => {
  const available = ["Shooter", "Role-playing (RPG)"];
  test("solo acepta géneros que existen en el ranking", () => {
    expect(pickGenre("Shooter", available)).toBe("Shooter");
    expect(pickGenre("Role-playing (RPG)", available)).toBe("Role-playing (RPG)");
    expect(pickGenre("Puzzle", available)).toBeNull();
    expect(pickGenre(undefined, available)).toBeNull();
    expect(pickGenre(["Shooter"], available)).toBeNull();
  });
});

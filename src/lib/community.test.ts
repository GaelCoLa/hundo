import { describe, expect, test } from "vitest";
import { isTopReviewer, parseReviewSort, TOP_REVIEWER_MIN } from "@/lib/community";

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

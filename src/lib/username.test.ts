import { describe, expect, test } from "vitest";
import { normalizeUsername, validateUsername } from "@/lib/username";

describe("normalizeUsername", () => {
  test("recorta espacios y pasa a minúsculas", () => {
    expect(normalizeUsername("  Gael_CoLa ")).toBe("gael_cola");
  });
});

describe("validateUsername", () => {
  test("acepta y normaliza un usuario válido", () => {
    expect(validateUsername("Gael_CoLa")).toEqual({ ok: true, value: "gael_cola" });
    expect(validateUsername("  gael  ")).toEqual({ ok: true, value: "gael" });
    expect(validateUsername("abc")).toEqual({ ok: true, value: "abc" });
    expect(validateUsername("a".repeat(20))).toEqual({ ok: true, value: "a".repeat(20) });
  });

  test("rechaza longitudes fuera de 3 a 20", () => {
    expect(validateUsername("ga")).toEqual({ ok: false, error: "too_short" });
    expect(validateUsername("   ")).toEqual({ ok: false, error: "too_short" });
    expect(validateUsername("a".repeat(21))).toEqual({ ok: false, error: "too_long" });
  });

  test("rechaza caracteres no permitidos", () => {
    for (const bad of ["Gael CoLa", "gaël", "gael!", "gael-cola", "gael.cola"]) {
      expect(validateUsername(bad)).toEqual({ ok: false, error: "invalid_chars" });
    }
  });
});

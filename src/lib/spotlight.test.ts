import { describe, expect, test } from "vitest";
import { pickSpotlight } from "@/lib/spotlight";

const game = (id: number, communityScore: number | null) => ({ id, communityScore });

describe("pickSpotlight", () => {
  test("elige el mejor puntuado entre los destacados del último mes", () => {
    expect(pickSpotlight([game(1, 80), game(2, 92), game(3, null)], [game(9, 99)])?.id).toBe(2);
  });
  test("si ningún destacado tiene nota, usa el mejor puntuado de siempre", () => {
    expect(pickSpotlight([game(1, null)], [game(9, 99), game(8, 90)])?.id).toBe(9);
  });
  test("sin ningún juego con nota no hay tarjeta real (se muestra el ejemplo)", () => {
    expect(pickSpotlight([game(1, null)], [])).toBeNull();
    expect(pickSpotlight([], [])).toBeNull();
  });
});

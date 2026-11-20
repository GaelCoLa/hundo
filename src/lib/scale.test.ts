import { describe, expect, test } from "vitest";
import { SCALE, getScaleCategory, toTen } from "@/lib/scale";

describe("getScaleCategory", () => {
  test.each([
    [1, "mediocre"],
    [39, "mediocre"],
    [40, "fair"],
    [59, "fair"],
    [60, "decent"],
    [74, "decent"],
    [75, "good"],
    [84, "good"],
    [85, "great"],
    [89, "great"],
    [90, "excellent"],
    [95, "excellent"],
    [96, "masterpiece"],
    [100, "masterpiece"],
  ])("%i es %s", (score, key) => {
    expect(getScaleCategory(score).key).toBe(key);
  });

  test.each([0, 101, 92.5, Number.NaN, -5])("%s fuera de rango lanza RangeError", (score) => {
    expect(() => getScaleCategory(score)).toThrow(RangeError);
  });
});

describe("toTen", () => {
  test("convierte a escala de 10 con un decimal", () => {
    expect(toTen(92)).toBe("9.2");
    expect(toTen(100)).toBe("10.0");
    expect(toTen(5)).toBe("0.5");
  });
});

describe("SCALE", () => {
  test("cubre 1..100 sin huecos ni solapes", () => {
    let expectedMin = 1;
    for (const category of SCALE) {
      expect(category.min).toBe(expectedMin);
      expect(category.max).toBeGreaterThanOrEqual(category.min);
      expectedMin = category.max + 1;
    }
    expect(expectedMin).toBe(101);
  });

  test("usa los colores del diseño aprobado", () => {
    expect(SCALE.map((c) => c.color)).toEqual([
      "#E5484D",
      "#F2884B",
      "#F5C451",
      "#9BD35A",
      "#46C27A",
      "#3AA8E0",
      "#B57CFF",
    ]);
  });
});

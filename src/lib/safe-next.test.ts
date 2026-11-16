import { describe, expect, test } from "vitest";
import { safeNextPath } from "@/lib/safe-next";

describe("safeNextPath", () => {
  test("acepta rutas internas", () => {
    expect(safeNextPath("/settings")).toBe("/settings");
    expect(safeNextPath("/es")).toBe("/es");
    expect(safeNextPath("/en/settings?tab=1")).toBe("/en/settings?tab=1");
  });

  test.each([
    "//evil.com",
    "/\\evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
    "https://evil.com",
    "evil.com",
    "javascript:alert(1)",
    "",
  ])("rechaza %j y devuelve /", (value) => {
    expect(safeNextPath(value)).toBe("/");
  });

  test("tolera valores ausentes o que no son texto", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath(undefined)).toBe("/");
  });
});

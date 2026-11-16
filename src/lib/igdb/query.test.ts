import { describe, expect, test } from "vitest";
import { buildSearchQuery, buildSlugQuery } from "@/lib/igdb/query";

describe("buildSlugQuery", () => {
  test("acepta slugs de IGDB", () => {
    expect(buildSlugQuery("hades--1")).toContain('where slug = "hades--1";');
  });
  test.each(['hades"; fields *', "Hades", "", "../x", "a b"])("rechaza %j", (slug) => {
    expect(buildSlugQuery(slug)).toBeNull();
  });
});

/** Extrae lo que quedó entre comillas en la cláusula search "...". */
function searchTerm(query: string): string {
  const match = query.match(/search "((?:[^"\\]|\\.)*)";/);
  if (!match) throw new Error(`sin cláusula search: ${query}`);
  return match[1];
}

describe("buildSearchQuery", () => {
  test("rechaza búsquedas de menos de 2 caracteres", () => {
    expect(buildSearchQuery("a")).toBeNull();
    expect(buildSearchQuery("   ")).toBeNull();
    expect(buildSearchQuery(" a ")).toBeNull();
  });

  test("arma la consulta con el término y el límite", () => {
    const q = buildSearchQuery("resident evil", 20)!;
    expect(searchTerm(q)).toBe("resident evil");
    expect(q).toContain("limit 20;");
    expect(q).toContain("where version_parent = null");
  });

  test("escapa comillas: no se puede cerrar el texto e inyectar cláusulas", () => {
    const q = buildSearchQuery('resi"; fields *; where id = 1')!;
    expect(searchTerm(q)).toBe('resi\\" fields * where id = 1');
    // Solo las cláusulas propias terminan en ";".
    expect(q.match(/;/g)!.length).toBe(4);
  });

  test("escapa barras invertidas", () => {
    expect(searchTerm(buildSearchQuery("a\\b")!)).toBe("a\\\\b");
  });

  test("recorta términos muy largos a 100 caracteres", () => {
    expect(searchTerm(buildSearchQuery("x".repeat(300))!)).toHaveLength(100);
  });
});

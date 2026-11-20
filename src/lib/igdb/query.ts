// Arma las consultas a IGDB, que usan su propio lenguaje ("Apicalypse"):
//   search "texto"; fields ...; where ...; limit 20;
// El texto lo escribe cualquier visitante, así que hay que neutralizarlo:
// si alguien escribe  resi"; fields *;  no debe poder cerrar las comillas
// y agregar cláusulas propias (es el mismo problema que la "inyección SQL").

export const GAME_FIELDS = [
  "name",
  "slug",
  "cover.image_id",
  "first_release_date",
  "genres.name",
  "involved_companies.developer",
  "involved_companies.company.name",
  "summary",
].join(",");

// Tipos de juego que mostramos: juego principal, remake, remaster, versión
// expandida y port. Dejamos afuera DLCs, mods, packs, temporadas, etc.
// Ids del endpoint /v4/game_types de IGDB (verificados el 19/11/2026):
// 0 Main Game, 4 Standalone Expansion, 8 Remake, 9 Remaster, 10 Expanded Game, 11 Port.
// Quedan afuera DLCs, bundles, mods, episodios, temporadas, packs y updates.
export const GAME_TYPE_IDS = [0, 4, 8, 9, 10, 11] as const;

const BASE_FILTER = `version_parent = null & game_type = (${GAME_TYPE_IDS.join(",")})`;

/** Consulta de búsqueda, o null si el término es demasiado corto. */
export function buildSearchQuery(term: string, limit = 20): string | null {
  const clean = term.trim().replace(/;/g, "").slice(0, 100);
  if (clean.length < 2) return null;
  const escaped = clean.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `search "${escaped}"; fields ${GAME_FIELDS}; where ${BASE_FILTER}; limit ${limit};`;
}

/** Consulta de un juego por su slug (el slug viene de nuestra propia URL). */
export function buildSlugQuery(slug: string): string | null {
  if (!/^[a-z0-9-]{1,200}$/.test(slug)) return null;
  return `fields ${GAME_FIELDS}; where slug = "${slug}"; limit 1;`;
}

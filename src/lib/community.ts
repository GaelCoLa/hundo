// Reglas de la comunidad que no dependen de la base ni de React (lógica pura,
// fácil de probar). Las usan el servidor y los componentes.

/** "Útil" recibidos en total para ganar la insignia Top reviewer (spec §5.3). */
export const TOP_REVIEWER_MIN = 50;

export function isTopReviewer(helpfulReceived: number): boolean {
  return helpfulReceived >= TOP_REVIEWER_MIN;
}

/** Orden de las reseñas: por defecto las más útiles; alternativa, las recientes. */
export type ReviewSort = "helpful" | "recent";

/** Lee el orden de la URL (?reviews= o ?sort=). Cualquier valor raro → "helpful". */
export function parseReviewSort(v: unknown): ReviewSort {
  return v === "recent" ? "recent" : "helpful";
}

/** Número de página de la URL (?page=): entero de 1 a 500; cualquier otra cosa → 1. */
export function parsePage(v: unknown): number {
  if (typeof v !== "string" || !/^\d+$/.test(v)) return 1;
  const n = Number(v);
  return n < 1 ? 1 : Math.min(n, 500);
}

/**
 * Cursor del feed (?before=): "mostrame lo anterior a esta fecha". Es más estable
 * que ?page= en una lista que cambia todo el tiempo: si alguien califica mientras
 * leés, no se repiten ni se saltean elementos. Fecha inválida → null (empezar arriba).
 */
export function parseBefore(v: unknown): string | null {
  if (typeof v !== "string" || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Prepara un texto para buscarlo con LIKE/ILIKE. En LIKE, "%" significa
 * "cualquier cosa" y "_" "un carácter cualquiera": sin escaparlos, buscar "%"
 * devolvería a todos los usuarios. Primero se duplica la barra invertida (que
 * es el carácter de escape) y después se escapan los comodines.
 */
/**
 * Texto de búsqueda de jugadores, en minúsculas, solo si podría ser parte de un
 * nombre de usuario (letras, números y "_", como exige la base). Cualquier otro
 * carácter no puede dar resultados, y algunos ("*", "%") la API los toma como
 * comodines: devolver null evita mandarlos a la consulta.
 */
export function usernameQuery(q: string): string | null {
  const lower = q.trim().toLowerCase();
  return /^[a-z0-9_]+$/.test(lower) ? lower : null;
}

/** Género de la URL (?genre=) solo si existe en el ranking; si no, null (todos). */
export function pickGenre(v: unknown, available: readonly string[]): string | null {
  return typeof v === "string" && available.includes(v) ? v : null;
}

export function escapeLike(term: string): string {
  return term.replace(/\\/g, "\\\\").replace(/[%_]/g, (c) => `\\${c}`);
}

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

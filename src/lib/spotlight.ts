// Qué juego protagoniza la tarjeta grande de la portada (lógica pura):
//  1. el mejor puntuado entre los destacados (los más calificados del último mes);
//  2. si ninguno tiene nota todavía, el mejor puntuado de siempre;
//  3. si ningún juego tiene nota (pocos votos válidos), null → tarjeta de ejemplo.
type Candidate = { id: number; communityScore: number | null };

export function pickSpotlight<T extends Candidate>(featured: T[], topRated: T[]): T | null {
  const scored = featured.filter((g) => g.communityScore !== null);
  if (scored.length > 0) return scored.reduce((best, g) => (g.communityScore! > best.communityScore! ? g : best));
  return topRated.find((g) => g.communityScore !== null) ?? null;
}

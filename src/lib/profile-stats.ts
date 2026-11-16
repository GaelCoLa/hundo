// Estadísticas del perfil: la versión web de la hoja "Resumen" de la planilla.
import { getScaleCategory, SCALE, type ScaleKey } from "./scale";

type StatsInput = { score: number; hoursPlayed: number | null; finishedOn: string | null };

export type ProfileStats = {
  count: number;
  average: number | null; // con un decimal
  averageOutOfTen: string | null;
  totalHours: number;
  finishedCount: number;
  byCategory: Record<ScaleKey, number>;
};

const oneDecimal = (n: number) => Math.round(n * 10) / 10;

export function computeProfileStats(ratings: StatsInput[]): ProfileStats {
  const byCategory = Object.fromEntries(SCALE.map((c) => [c.key, 0])) as Record<ScaleKey, number>;
  let sum = 0;
  let hours = 0;
  let finished = 0;

  for (const r of ratings) {
    sum += r.score;
    hours += r.hoursPlayed ?? 0;
    if (r.finishedOn) finished += 1;
    byCategory[getScaleCategory(r.score).key] += 1;
  }

  const raw = ratings.length > 0 ? sum / ratings.length : null;
  return {
    count: ratings.length,
    average: raw === null ? null : oneDecimal(raw),
    averageOutOfTen: raw === null ? null : (raw / 10).toFixed(1),
    totalHours: oneDecimal(hours),
    finishedCount: finished,
    byCategory,
  };
}

export type LibrarySort = "score" | "recent" | "hours" | "finished";

export type LibraryItem = StatsInput & { name: string; updatedAt: string };

/** Ordena de mayor a menor; los valores vacíos van siempre al final. Devuelve una lista nueva. */
export function sortLibrary<T extends LibraryItem>(items: T[], by: LibrarySort): T[] {
  const key = (i: T): number | string | null =>
    by === "score" ? i.score : by === "hours" ? i.hoursPlayed : by === "finished" ? i.finishedOn : i.updatedAt;

  return [...items].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka === null && kb === null) return 0;
    if (ka === null) return 1;
    if (kb === null) return -1;
    return ka < kb ? 1 : ka > kb ? -1 : 0;
  });
}

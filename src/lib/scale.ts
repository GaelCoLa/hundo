// La escala de Hundo: 7 categorías del 1 al 100 (la misma de la planilla original).
// Es la "fuente de verdad" de rangos y colores: cualquier parte de la página que
// necesite saber qué categoría es un 92 pregunta acá, así nunca hay dos versiones.

export type ScaleKey =
  | "mediocre"
  | "fair"
  | "decent"
  | "good"
  | "great"
  | "excellent"
  | "masterpiece";

export type ScaleCategory = {
  key: ScaleKey;
  min: number;
  max: number;
  color: string;
};

export const SCALE: ReadonlyArray<ScaleCategory> = [
  { key: "mediocre", min: 1, max: 39, color: "#E5484D" },
  { key: "fair", min: 40, max: 59, color: "#F2884B" },
  { key: "decent", min: 60, max: 74, color: "#F5C451" },
  { key: "good", min: 75, max: 84, color: "#9BD35A" },
  { key: "great", min: 85, max: 89, color: "#46C27A" },
  { key: "excellent", min: 90, max: 95, color: "#3AA8E0" },
  { key: "masterpiece", min: 96, max: 100, color: "#B57CFF" },
];

/** Devuelve la categoría de una nota. Solo acepta enteros del 1 al 100. */
export function getScaleCategory(score: number): ScaleCategory {
  if (!Number.isInteger(score) || score < 1 || score > 100) {
    throw new RangeError(`Score must be an integer from 1 to 100, got ${score}`);
  }
  // El find siempre encuentra algo porque SCALE cubre 1..100 (lo garantiza una prueba).
  return SCALE.find((c) => score >= c.min && score <= c.max)!;
}

/** Nota sobre 10 con un decimal: 92 → "9.2". */
export function toTen(score: number): string {
  return (score / 10).toFixed(1);
}

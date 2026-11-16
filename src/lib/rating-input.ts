// Valida lo que una persona escribe en el formulario de calificación ANTES de
// mandarlo a la base, para mostrar un mensaje claro. La base de datos tiene las
// mismas reglas como respaldo (CHECK y triggers), por si alguien se saltea esto.

export type RatingForm = {
  score: string;
  review: string;
  hasSpoilers: string | null; // "on" si la casilla está marcada
  hours: string;
  finishedOn: string; // "AAAA-MM-DD" de <input type="date">
};

export type RatingInput = {
  score: number;
  review: string | null;
  hasSpoilers: boolean;
  hoursPlayed: number | null;
  finishedOn: string | null;
};

export type RatingInputError = "score_range" | "review_too_long" | "hours_invalid" | "date_future" | "date_invalid";

export type RatingParseResult = { ok: true; value: RatingInput } | { ok: false; error: RatingInputError };

const MAX_REVIEW = 5000;
const MAX_HOURS = 9999.9;

export function parseRatingInput(form: RatingForm, today: Date): RatingParseResult {
  const scoreText = form.score.trim();
  const score = Number(scoreText);
  if (!/^\d+$/.test(scoreText) || score < 1 || score > 100) return { ok: false, error: "score_range" };

  const review = form.review.trim();
  if (review.length > MAX_REVIEW) return { ok: false, error: "review_too_long" };

  let hoursPlayed: number | null = null;
  const hoursText = form.hours.trim().replace(",", ".");
  if (hoursText !== "") {
    if (!/^\d+(\.\d+)?$/.test(hoursText)) return { ok: false, error: "hours_invalid" };
    hoursPlayed = Math.round(Number(hoursText) * 10) / 10;
    if (hoursPlayed > MAX_HOURS) return { ok: false, error: "hours_invalid" };
  }

  let finishedOn: string | null = null;
  const dateText = form.finishedOn.trim();
  if (dateText !== "") {
    if (!isRealDate(dateText) || dateText < "1970-01-01") return { ok: false, error: "date_invalid" };
    // Comparamos en UTC, igual que el CHECK de la base (current_date de Postgres).
    if (dateText > today.toISOString().slice(0, 10)) return { ok: false, error: "date_future" };
    finishedOn = dateText;
  }

  return {
    ok: true,
    value: { score, review: review === "" ? null : review, hasSpoilers: form.hasSpoilers === "on", hoursPlayed, finishedOn },
  };
}

/** "2026-02-30" tiene el formato correcto pero no existe: lo detectamos. */
function isRealDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

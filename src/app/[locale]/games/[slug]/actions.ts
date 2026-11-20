"use server";
// Guardar y borrar la calificación de un juego.
// Usan el cliente con la sesión del usuario (no la clave secreta): así las
// reglas RLS de la base garantizan que cada uno solo toca lo suyo.
import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { parseRatingInput, readRatingForm, type RatingForm, type RatingInputError } from "@/lib/rating-input";

export type RatingErrorCode = RatingInputError | "not_signed_in" | "rate_limited" | "unknown";
export type RatingState = {
  error?: RatingErrorCode;
  saved?: boolean;
  deleted?: boolean;
  // Si hubo un error, lo que la persona escribió: el formulario lo vuelve a
  // mostrar (React vacía los campos al terminar una acción de formulario).
  values?: RatingForm;
};

/**
 * Única acción del formulario. El botón "Borrar" manda intent=delete; el de
 * guardar, nada. Así guardar y borrar comparten el mismo estado y mensajes.
 */
export async function submitRating(gameId: number, _prev: RatingState, formData: FormData): Promise<RatingState> {
  return formData.get("intent") === "delete" ? deleteRating(gameId) : saveRating(gameId, formData);
}

async function saveRating(gameId: number, formData: FormData): Promise<RatingState> {
  const raw = readRatingForm(formData);
  const user = await getCurrentUser();
  if (!user) return { error: "not_signed_in", values: raw };

  const parsed = parseRatingInput(raw, new Date());
  if (!parsed.ok) return { error: parsed.error, values: raw };

  const values = {
    score: parsed.value.score,
    review: parsed.value.review,
    has_spoilers: parsed.value.hasSpoilers,
    hours_played: parsed.value.hoursPlayed,
    finished_on: parsed.value.finishedOn,
  };

  const supabase = await createClient();
  // Insertar o actualizar por separado (no "upsert"): el usuario no tiene
  // permiso para modificar user_id ni game_id de una fila existente.
  const { data: existing } = await supabase
    .from("ratings")
    .select("id")
    .eq("user_id", user.id)
    .eq("game_id", gameId)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("ratings").update(values).eq("id", existing.id)
    : await supabase.from("ratings").insert({ ...values, user_id: user.id, game_id: gameId });

  if (error) {
    if (error.message.includes("rate_limited")) return { error: "rate_limited", values: raw };
    console.error("saveRating failed", error.code, error.message);
    return { error: "unknown", values: raw };
  }

  refresh();
  return { saved: true };
}

async function deleteRating(gameId: number): Promise<RatingState> {
  const user = await getCurrentUser();
  if (!user) return { error: "not_signed_in" };
  const supabase = await createClient();
  const { error } = await supabase.from("ratings").delete().eq("user_id", user.id).eq("game_id", gameId);
  if (error) {
    console.error("deleteRating failed", error.code, error.message);
    return { error: "unknown" };
  }
  refresh();
  return { deleted: true };
}

"use server";
// Guardar y borrar la calificación de un juego.
// Usan el cliente con la sesión del usuario (no la clave secreta): así las
// reglas RLS de la base garantizan que cada uno solo toca lo suyo.
import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { parseRatingInput, type RatingInputError } from "@/lib/rating-input";

export type RatingErrorCode = RatingInputError | "not_signed_in" | "rate_limited" | "unknown";
export type RatingState = { error?: RatingErrorCode; saved?: boolean };

export async function saveRating(gameId: number, _prev: RatingState, formData: FormData): Promise<RatingState> {
  const user = await getCurrentUser();
  if (!user) return { error: "not_signed_in" };

  const parsed = parseRatingInput(
    {
      score: String(formData.get("score") ?? ""),
      review: String(formData.get("review") ?? ""),
      hasSpoilers: formData.get("hasSpoilers") as string | null,
      hours: String(formData.get("hours") ?? ""),
      finishedOn: String(formData.get("finishedOn") ?? ""),
    },
    new Date(),
  );
  if (!parsed.ok) return { error: parsed.error };

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
    if (error.message.includes("rate_limited")) return { error: "rate_limited" };
    console.error("saveRating failed", error.code, error.message);
    return { error: "unknown" };
  }

  refresh();
  return { saved: true };
}

export async function deleteRating(gameId: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const supabase = await createClient();
  const { error } = await supabase.from("ratings").delete().eq("user_id", user.id).eq("game_id", gameId);
  if (error) console.error("deleteRating failed", error.code, error.message);
  refresh();
}

"use server";
// Acciones de la comunidad. Usan el cliente con la sesión del usuario: las reglas
// RLS de la base deciden si se puede (no votar lo propio, no votar dos veces...).
import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { parseReportInput, type ReportInputError } from "@/lib/moderation";

/** Marca o desmarca una reseña como "útil". */
export async function toggleHelpful(ratingId: string, liked: boolean): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const supabase = await createClient();
  const { error } = liked
    ? await supabase.from("review_likes").insert({ user_id: user.id, rating_id: ratingId })
    : await supabase.from("review_likes").delete().eq("user_id", user.id).eq("rating_id", ratingId);
  // 23505 = ya existía (doble clic, otra pestaña): el resultado es el pedido.
  if (error && error.code !== "23505") {
    console.error("toggleHelpful failed", error.code, error.message);
    return { ok: false };
  }
  refresh();
  return { ok: true };
}

/** Seguir o dejar de seguir a un jugador. */
export async function toggleFollow(followeeId: string, follow: boolean): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const supabase = await createClient();
  const { error } = follow
    ? await supabase.from("follows").insert({ follower_id: user.id, followee_id: followeeId })
    : await supabase.from("follows").delete().eq("follower_id", user.id).eq("followee_id", followeeId);
  if (error && error.code !== "23505") {
    console.error("toggleFollow failed", error.code, error.message);
    return { ok: false };
  }
  refresh();
  return { ok: true };
}

export type ReportState = { sent?: boolean; error?: ReportInputError | "not_signed_in" | "unknown" };

/** Reportar una reseña. Si ya la habías reportado, se toma como enviado. */
export async function reportReview(ratingId: string, _prev: ReportState, formData: FormData): Promise<ReportState> {
  const user = await getCurrentUser();
  if (!user) return { error: "not_signed_in" };
  const parsed = parseReportInput({ reason: String(formData.get("reason") ?? ""), details: String(formData.get("details") ?? "") });
  if (!parsed.ok) return { error: parsed.error };
  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .insert({ reporter_id: user.id, rating_id: ratingId, reason: parsed.value.reason, details: parsed.value.details });
  if (error && error.code !== "23505") {
    console.error("reportReview failed", error.code, error.message);
    return { error: "unknown" };
  }
  return { sent: true };
}

"use server";
// Acciones de la comunidad. Usan el cliente con la sesión del usuario: las reglas
// RLS de la base deciden si se puede (no votar lo propio, no votar dos veces...).
import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

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

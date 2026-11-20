"use server";
// Acciones de Configuración: editar el perfil (nombre visible, bio, avatar).
// Usan el cliente con la sesión del usuario: las reglas RLS y de Storage de la
// base garantizan que cada uno solo toca lo suyo.
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { AVATAR_CONTENT_TYPES, confirmMatches, parseProfileInput, sniffImageType, validateAvatar, validateFavorites, type AvatarError, type FavoritesError, type ProfileInputError } from "@/lib/profile-input";

export type ProfileState = { error?: ProfileInputError | "not_signed_in" | "unknown"; saved?: boolean };
export type AvatarState = { error?: AvatarError | "not_signed_in" | "unknown"; saved?: boolean };
export type FavoritesState = { error?: FavoritesError | "not_signed_in" | "unknown"; saved?: boolean };

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { error: "not_signed_in" };
  const parsed = parseProfileInput({
    displayName: String(formData.get("displayName") ?? ""),
    bio: String(formData.get("bio") ?? ""),
  });
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.value.displayName, bio: parsed.value.bio })
    .eq("id", user.id);
  if (error) {
    console.error("updateProfile failed", error.code, error.message);
    return { error: "unknown" };
  }
  refresh();
  return { saved: true };
}

export async function updateAvatar(_prev: AvatarState, formData: FormData): Promise<AvatarState> {
  const user = await getCurrentUser();
  if (!user) return { error: "not_signed_in" };
  const file = formData.get("avatar");
  if (!(file instanceof File)) return { error: "avatar_empty" };
  const check = validateAvatar(file);
  if (!check.ok) return { error: check.error };
  // El tipo que manda el navegador sale de la extensión: se confirma con la
  // firma real del archivo (sus primeros bytes), y es la firma la que decide.
  const realType = sniffImageType(new Uint8Array(await file.slice(0, 12).arrayBuffer()));
  if (!realType) return { error: "avatar_type" };

  const supabase = await createClient();
  // Nombre nuevo en cada subida: así nadie ve una versión vieja guardada en caché.
  const path = `${user.id}/${Date.now()}.${realType}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: AVATAR_CONTENT_TYPES[realType] });
  if (uploadError) {
    console.error("updateAvatar upload failed", uploadError.message);
    return { error: "unknown" };
  }
  const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
  if (error) {
    console.error("updateAvatar profile failed", error.code, error.message);
    await supabase.storage.from("avatars").remove([path]);
    return { error: "unknown" };
  }
  // El avatar anterior ya no se usa: se borra (si falla, solo queda un archivo huérfano).
  if (user.avatarUrl && user.avatarUrl !== path) await supabase.storage.from("avatars").remove([user.avatarUrl]);
  refresh();
  return { saved: true };
}

export async function removeAvatar(): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !user.avatarUrl) return;
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) {
    console.error("removeAvatar failed", error.code, error.message);
    return;
  }
  await supabase.storage.from("avatars").remove([user.avatarUrl]);
  refresh();
}

/** Guarda el Top 5 (campos fav1..fav5, en orden): borra los anteriores e inserta los nuevos. */
export async function updateFavorites(_prev: FavoritesState, formData: FormData): Promise<FavoritesState> {
  const user = await getCurrentUser();
  if (!user) return { error: "not_signed_in" };
  const supabase = await createClient();

  const { data: rated } = await supabase.from("ratings").select("game_id").eq("user_id", user.id);
  const ids = [1, 2, 3, 4, 5].map((i) => Number(formData.get(`fav${i}`)));
  const check = validateFavorites(ids, new Set((rated ?? []).map((r) => r.game_id as number)));
  if (!check.ok) return { error: check.error };

  const { error: deleteError } = await supabase.from("favorites").delete().eq("user_id", user.id);
  if (deleteError) {
    console.error("updateFavorites delete failed", deleteError.code, deleteError.message);
    return { error: "unknown" };
  }
  if (check.value.length > 0) {
    const { error } = await supabase
      .from("favorites")
      .insert(check.value.map((gameId, i) => ({ user_id: user.id, position: i + 1, game_id: gameId })));
    if (error) {
      console.error("updateFavorites insert failed", error.code, error.message);
      return { error: "unknown" };
    }
  }
  refresh();
  return { saved: true };
}

export type DeleteState = { error?: "confirm_mismatch" | "not_signed_in" | "unknown" };

/**
 * Borra la cuenta. La cuenta de Auth se borra con el cliente de clave secreta
 * (un usuario no puede borrarse a sí mismo de Auth); las claves foráneas con
 * "on delete cascade" borran perfil, calificaciones, likes, seguimientos,
 * favoritos y reportes, y los triggers descuentan los contadores de los demás.
 */
export async function deleteAccount(lang: string, _prev: DeleteState, formData: FormData): Promise<DeleteState> {
  const user = await getCurrentUser();
  if (!user) return { error: "not_signed_in" };
  if (!confirmMatches(String(formData.get("confirm") ?? ""), user.username)) return { error: "confirm_mismatch" };

  const supabase = await createClient();
  // Fotos de perfil (la carpeta del usuario). Si falla, solo quedan archivos huérfanos.
  const { data: files } = await supabase.storage.from("avatars").list(user.id);
  if (files && files.length > 0) await supabase.storage.from("avatars").remove(files.map((f) => `${user.id}/${f.name}`));

  const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
  if (error) {
    console.error("deleteAccount failed", error.message);
    return { error: "unknown" };
  }
  await supabase.auth.signOut();
  const locale = (routing.locales as readonly string[]).includes(lang) ? lang : routing.defaultLocale;
  redirect(`/${locale}`);
}

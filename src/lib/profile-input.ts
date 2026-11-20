// Validación de lo que una persona escribe o sube al editar su perfil (lógica
// pura, sin base ni React). La base tiene los mismos límites como respaldo.

const MAX_DISPLAY_NAME = 40;
const MAX_BIO = 300;
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

export type ProfileInputError = "display_name_too_long" | "bio_too_long";

/** Nombre visible y bio: se recortan los espacios; vacío → null (sin dato). */
export function parseProfileInput(form: {
  displayName: string;
  bio: string;
}): { ok: true; value: { displayName: string | null; bio: string | null } } | { ok: false; error: ProfileInputError } {
  const displayName = form.displayName.trim();
  const bio = form.bio.trim();
  if (displayName.length > MAX_DISPLAY_NAME) return { ok: false, error: "display_name_too_long" };
  if (bio.length > MAX_BIO) return { ok: false, error: "bio_too_long" };
  return { ok: true, value: { displayName: displayName || null, bio: bio || null } };
}

export type AvatarError = "avatar_type" | "avatar_too_big" | "avatar_empty";
type AvatarExt = "png" | "jpg" | "webp";

// Solo formatos de imagen comunes. SVG queda afuera a propósito: es texto y
// puede llevar código (scripts) adentro.
const AVATAR_TYPES: Record<string, AvatarExt> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

export function validateAvatar(file: { size: number; type: string }): { ok: true; ext: AvatarExt } | { ok: false; error: AvatarError } {
  if (file.size === 0) return { ok: false, error: "avatar_empty" };
  const ext = AVATAR_TYPES[file.type];
  if (!ext) return { ok: false, error: "avatar_type" };
  if (file.size > MAX_AVATAR_BYTES) return { ok: false, error: "avatar_too_big" };
  return { ok: true, ext };
}

// "<id del usuario>/<marca de tiempo>.<extensión>", como lo guarda updateAvatar.
const AVATAR_PATH = /^[0-9a-f-]{36}\/\d+\.(png|jpg|webp)$/;

/**
 * URL pública de un avatar. La base guarda solo la ruta dentro del bucket; si
 * la ruta no tiene la forma esperada (alguien escribió otra cosa en avatar_url),
 * no se muestra nada: así nadie puede apuntar su foto a otro sitio. Además la
 * carpeta tiene que ser la del dueño del perfil: nadie puede mostrar como suya
 * la foto de otro jugador.
 */
export function avatarPublicUrl(path: string | null, ownerId: string, supabaseUrl: string): string | null {
  if (!path || !AVATAR_PATH.test(path) || !path.startsWith(`${ownerId}/`)) return null;
  return `${supabaseUrl}/storage/v1/object/public/avatars/${path}`;
}

/**
 * Tipo real de una imagen según sus primeros bytes (su "firma"). El tipo que
 * informa el navegador sale de la extensión del archivo, así que un .exe
 * renombrado a .png diría "image/png": la firma no se puede disimular así.
 */
export function sniffImageType(head: Uint8Array): AvatarExt | null {
  const starts = (...sig: number[]) => sig.every((b, i) => head[i] === b);
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "png";
  if (starts(0xff, 0xd8, 0xff)) return "jpg";
  // WebP: "RIFF" + 4 bytes de tamaño + "WEBP".
  if (starts(0x52, 0x49, 0x46, 0x46) && head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50) return "webp";
  return null;
}

export const AVATAR_CONTENT_TYPES: Record<AvatarExt, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

export type FavoritesError = "favorites_too_many" | "favorites_duplicate" | "favorites_not_rated";

/**
 * Top 5 favoritos: lo elegido en los 5 desplegables, en orden. Los desplegables
 * vacíos (0 o NaN) se saltean; no puede haber más de 5, ni repetidos, ni juegos
 * que el usuario no calificó.
 */
export function validateFavorites(gameIds: number[], rated: ReadonlySet<number>): { ok: true; value: number[] } | { ok: false; error: FavoritesError } {
  const picked = gameIds.filter((id) => Number.isInteger(id) && id > 0);
  if (picked.length > 5) return { ok: false, error: "favorites_too_many" };
  if (new Set(picked).size !== picked.length) return { ok: false, error: "favorites_duplicate" };
  if (picked.some((id) => !rated.has(id))) return { ok: false, error: "favorites_not_rated" };
  return { ok: true, value: picked };
}

/** Confirmación para borrar la cuenta: escribir el propio nombre de usuario. */
export function confirmMatches(typed: string, username: string): boolean {
  return typed.trim().toLowerCase() === username.toLowerCase() && username !== "";
}

// Reglas del nombre de usuario: 3 a 20 caracteres, solo a-z, 0-9 y "_".
// Son las mismas que el CHECK de la base de datos; validar acá primero
// permite mostrar un mensaje claro en vez de un error técnico.

export type UsernameError = "too_short" | "too_long" | "invalid_chars";

export type UsernameResult =
  | { ok: true; value: string }
  | { ok: false; error: UsernameError };

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsername(raw: string): UsernameResult {
  const value = normalizeUsername(raw);
  if (value.length < 3) return { ok: false, error: "too_short" };
  if (value.length > 20) return { ok: false, error: "too_long" };
  if (!/^[a-z0-9_]+$/.test(value)) return { ok: false, error: "invalid_chars" };
  return { ok: true, value };
}

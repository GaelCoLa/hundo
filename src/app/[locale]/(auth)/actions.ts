"use server";
// Server Actions: funciones que corren en el servidor y se llaman desde un <form>.
// Las claves y la sesión nunca pasan por el navegador. Devuelven un código de error
// (p. ej. "username_taken") y el formulario lo traduce al idioma del visitante.
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { validateUsername } from "@/lib/username";
import { routing, type Locale } from "@/i18n/routing";

export type AuthErrorCode =
  | "too_short"
  | "too_long"
  | "invalid_chars"
  | "username_taken"
  | "invalid_email"
  | "password_too_short"
  | "invalid_credentials"
  | "email_not_confirmed"
  | "unknown";

export type AuthState = { error?: AuthErrorCode; checkEmail?: boolean };

const MIN_PASSWORD = 8;

function safeLocale(value: string): Locale {
  return (routing.locales as readonly string[]).includes(value) ? (value as Locale) : routing.defaultLocale;
}

/** Solo rutas internas ("/settings"), nunca URLs externas: evita redirecciones maliciosas. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function signUp(localeArg: string, _prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = safeLocale(localeArg);
  const username = validateUsername(String(formData.get("username") ?? ""));
  if (!username.ok) return { error: username.error };

  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "invalid_email" };

  const password = String(formData.get("password") ?? "");
  if (password.length < MIN_PASSWORD) return { error: "password_too_short" };

  const supabase = await createClient();

  // Chequeo previo para dar un mensaje claro. La base de datos igual lo garantiza
  // con su índice único (por si dos personas eligen el mismo nombre a la vez).
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username.value)
    .maybeSingle();
  if (existing) return { error: "username_taken" };

  const origin = (await headers()).get("origin") ?? "";
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username: username.value, locale },
      emailRedirectTo: `${origin}/auth/confirm?next=/${locale}`,
    },
  });

  if (error) {
    // Si el índice único rechazó el usuario, Supabase devuelve un error genérico de base de datos.
    if (error.message.toLowerCase().includes("database error")) return { error: "username_taken" };
    if (error.code === "weak_password") return { error: "password_too_short" };
    if (error.code === "email_address_invalid") return { error: "invalid_email" };
    console.error("signUp failed", error.code, error.message);
    return { error: "unknown" };
  }
  return { checkEmail: true };
}

export async function logIn(localeArg: string, _prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = safeLocale(localeArg);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });

  if (error) {
    if (error.code === "email_not_confirmed") return { error: "email_not_confirmed" };
    if (error.code === "invalid_credentials") return { error: "invalid_credentials" };
    console.error("logIn failed", error.code, error.message);
    return { error: "unknown" };
  }
  const next = safeNext(formData.get("next"));
  redirect(next === "/" ? `/${locale}` : `/${locale}${next}`);
}

export async function logOut(localeArg: string): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${safeLocale(localeArg)}`);
}

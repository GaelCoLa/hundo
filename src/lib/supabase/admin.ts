// Cliente de Supabase con la clave SECRETA. Saltea las reglas RLS, así que:
//  - solo se importa en código de servidor ("server-only" rompe la compilación
//    si alguien lo importa desde un componente del navegador), y
//  - solo se usa para escribir la copia de juegos de IGDB, nunca con datos
//    que mande el usuario.
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY are not set");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

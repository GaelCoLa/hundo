// Cliente de Supabase para el NAVEGADOR (Client Components con "use client").
// Usa la clave publishable, que es pública: lo que puede hacer lo limitan las
// políticas RLS de la base de datos, no el secreto de la clave.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

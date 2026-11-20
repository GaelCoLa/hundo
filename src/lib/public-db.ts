// Cliente de Supabase SIN sesión (como un visitante anónimo): para datos
// públicos e iguales para todos (rankings, destacados, chequeo de salud).
// Al no leer cookies, sus consultas se pueden guardar con "use cache" y las
// páginas pueden pre-generarse.
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  });
}

// Cliente de Supabase para el SERVIDOR (Server Components, Server Actions, Route Handlers).
// Lee y escribe la sesión en cookies, así el servidor sabe quién está conectado.
// Con Cache Components, cualquier componente que lo use debe estar dentro de <Suspense>.
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

export async function createClient() {
  // Todo lo que use este cliente depende de la sesión del visitante y de la hora
  // (los tokens vencen): se calcula en cada visita, nunca se pre-genera.
  await connection();
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // En un Server Component no se pueden escribir cookies. No pasa nada:
            // el proxy (src/proxy.ts) ya renueva la sesión en cada pedido.
          }
        },
      },
    },
  );
}

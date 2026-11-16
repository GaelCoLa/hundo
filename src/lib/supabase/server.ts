// Cliente de Supabase para el SERVIDOR (Server Components, Server Actions, Route Handlers).
// Lee y escribe la sesión en cookies, así el servidor sabe quién está conectado.
// Con Cache Components, cualquier componente que lo use debe estar dentro de <Suspense>.
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
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

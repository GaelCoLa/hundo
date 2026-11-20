// El "proxy" (antes llamado middleware) corre antes de cada pedido. Hace dos cosas:
//   1. Idioma: si la URL no lo tiene, redirige a /en o /es (next-intl).
//   2. Sesión: renueva el token de Supabase si está por vencer.
import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/proxy";

const handleI18n = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const response = handleI18n(request);
  return updateSession(request, response);
}

export const config = {
  // Corre en todo menos rutas internas, la API, la confirmación de email, los
  // íconos generados (/icon, /apple-icon: no tienen extensión pero no llevan
  // idioma) y archivos con extensión.
  matcher: ["/((?!api|auth|_next|_vercel|icon|apple-icon|.*\\..*).*)"],
};

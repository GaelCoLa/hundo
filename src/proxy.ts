// El "proxy" (antes llamado middleware) corre antes de cada pedido.
// Por ahora solo se encarga del idioma: si la URL no lo tiene, redirige a /en o /es.
// En la Tarea 3 se le suma la renovación de la sesión de Supabase.
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Corre en todo menos rutas internas, la API, la confirmación de email y archivos con extensión.
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};

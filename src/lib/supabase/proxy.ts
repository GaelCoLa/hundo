// Renovación de la sesión en el proxy.
// Los tokens de sesión vencen cada tanto. En cada pedido, este código le pide a
// Supabase que verifique el token y, si hace falta, escribe uno nuevo en las
// cookies de la respuesta. Recibe la respuesta que ya armó next-intl y le agrega
// esas cookies.
import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

export async function updateSession(
  request: NextRequest,
  response: NextResponse,
): Promise<NextResponse> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // getClaims() valida el token (y lo renueva si venció). No borrar esta línea.
  await supabase.auth.getClaims();

  return response;
}

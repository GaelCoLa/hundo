// El enlace del email de confirmación llega acá.
// Acepta los dos formatos que puede mandar Supabase:
//   - ?token_hash=...&type=email  (plantilla personalizada; funciona en cualquier dispositivo)
//   - ?code=...                   (plantilla por defecto; mismo navegador donde se registró)
// Si sale bien, la persona queda con sesión iniciada y vuelve a la página.
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-next";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));

  const supabase = await createClient();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  let ok = false;
  if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  } else if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  }

  return NextResponse.redirect(new URL(ok ? next : "/login?confirm_error=1", origin));
}

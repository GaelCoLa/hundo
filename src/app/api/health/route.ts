// /api/health: chequeo de salud. Hace una consulta mínima a la base (ping) y
// responde { ok: true }. Vercel la llama una vez por día (vercel.json → crons):
// en el plan gratis, Supabase pausa un proyecto tras 7 días sin actividad, y
// esta visita diaria lo mantiene despierto. También sirve para monitorear.
import { createPublicClient } from "@/lib/public-db";
import { connection } from "next/server";

export async function GET() {
  // Que se ejecute en cada pedido: una respuesta pre-generada no tocaría la base.
  await connection();
  const supabase = createPublicClient();
  const { error } = await supabase.rpc("ping");
  if (error) {
    console.error("health: ping failed", error.code, error.message);
    return Response.json({ ok: false }, { status: 503 });
  }
  return Response.json({ ok: true });
}

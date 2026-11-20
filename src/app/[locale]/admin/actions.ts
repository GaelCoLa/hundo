"use server";
// Acciones del panel de moderación. Llaman funciones SQL que ya verifican que
// quien llama es administrador (si no, la base responde "forbidden"). El
// chequeo de acá es una segunda capa y evita llamadas inútiles.
import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

async function adminRpc(fn: string, args: Record<string, unknown>): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, args);
  if (error) console.error(`${fn} failed`, error.code, error.message);
  refresh();
}

export async function hideReview(ratingId: string, hidden: boolean): Promise<void> {
  await adminRpc("moderate_rating", { p_rating_id: ratingId, p_hidden: hidden });
}

export async function suspendUser(userId: string, suspended: boolean): Promise<void> {
  await adminRpc("set_suspended", { p_user_id: userId, p_suspended: suspended });
}

export async function dismissReport(reportId: string): Promise<void> {
  await adminRpc("resolve_report", { p_report_id: reportId });
}

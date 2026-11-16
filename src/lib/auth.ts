// "Capa de acceso a datos" de la sesión: el único lugar que responde
// "¿quién está conectado?". Así la lógica no queda repartida por toda la página.
// React `cache` evita repetir la consulta si varios componentes la piden en el mismo render.
import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // La sesión es de cada visitante y su validez depende de la hora actual
  // (el token vence). connection() le dice a Next que esto se calcula en cada
  // pedido y nunca se pre-genera al compilar.
  await connection();
  const supabase = await createClient();
  // getClaims() verifica la firma del token; no confiamos en datos sin verificar.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, is_admin")
    .eq("id", claims.sub)
    .single();
  if (!profile) return null;

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    username: profile.username,
    isAdmin: profile.is_admin,
  };
});

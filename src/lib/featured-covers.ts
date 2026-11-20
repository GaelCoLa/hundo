// Portadas reales para el collage animado de la portada del sitio: los juegos
// más calificados que tengan portada. Usa el cliente anónimo (sin sesión, sin
// cookies) porque es información pública e igual para todos los visitantes.
// "use cache" + cacheLife("hours"): se consulta la base como mucho una vez por
// hora, y la portada del sitio puede seguir pre-generándose.
import "server-only";
import { cacheLife } from "next/cache";
import { createClient } from "@supabase/supabase-js";

export type FeaturedCover = { slug: string; name: string; coverImageId: string };

export async function getFeaturedCovers(limit = 5): Promise<FeaturedCover[]> {
  "use cache";
  cacheLife("hours");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { data, error } = await supabase
    .from("games")
    .select("slug, name, cover_image_id")
    .not("cover_image_id", "is", null)
    .order("ratings_count", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("featured covers failed", error.code, error.message);
    return [];
  }
  return (data ?? []).map((g) => ({ slug: g.slug, name: g.name, coverImageId: g.cover_image_id! }));
}

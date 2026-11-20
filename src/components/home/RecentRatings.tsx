// "Calificaciones recientes" de la portada: las últimas 8 notas públicas.
// Se calcula en cada visita (va dentro de <Suspense> en la portada), así la
// portada muestra actividad real sin tener que regenerarse a mano.
// Si todavía no hay ninguna calificación, la sección no se muestra.
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getScaleCategory } from "@/lib/scale";
import { Cover } from "@/components/games/Cover";
import { StaggerItem, StaggerList } from "@/components/motion/Stagger";
import { TiltCard } from "@/components/motion/TiltCard";

type RecentRow = {
  id: string;
  score: number;
  games: { slug: string; name: string; cover_image_id: string | null } | null;
  profiles: { username: string } | null;
};

export async function RecentRatings() {
  const [t, ts, supabase] = await Promise.all([getTranslations("home"), getTranslations("scale"), createClient()]);
  // RLS ya oculta perfiles suspendidos; is_hidden se filtra explícito porque
  // el dueño de una nota oculta igual la vería.
  const { data } = await supabase
    .from("ratings")
    .select("id, score, games(slug, name, cover_image_id), profiles(username)")
    .eq("is_hidden", false)
    .order("updated_at", { ascending: false })
    .limit(8)
    .returns<RecentRow[]>();

  const items = (data ?? []).filter((r) => r.games && r.profiles);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="recent" className="flex flex-col gap-5">
      <h2 id="recent" className="font-display text-4xl font-black uppercase">
        {t("recentTitle")}
      </h2>
      <StaggerList className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map((r) => {
          const category = getScaleCategory(r.score);
          return (
            <StaggerItem key={r.id} className="flex flex-col gap-2">
              <Link href={`/games/${r.games!.slug}`} className="group block rounded-xl">
                <TiltCard>
                  <Cover imageId={r.games!.cover_image_id} name={r.games!.name} size="t_cover_big" className="transition-shadow duration-300 group-hover:shadow-[0_18px_36px_-14px_rgba(0,0,0,0.9)] group-hover:ring-2 group-hover:ring-accent" />
                  {/* translateZ: la nota "flota" por delante de la portada cuando se inclina. */}
                  <span
                    className="absolute bottom-2 right-2 rounded-lg bg-bg/90 px-2 py-1 font-display text-2xl font-black leading-none [transform:translateZ(30px)]"
                    style={{ color: category.color }}
                    aria-label={ts("ringLabel", { score: r.score, category: ts(category.key) })}
                  >
                    {r.score}
                  </span>
                </TiltCard>
              </Link>
              <span className="flex flex-col">
                <Link href={`/games/${r.games!.slug}`} className="line-clamp-1 font-semibold leading-tight hover:underline">
                  {r.games!.name}
                </Link>
                <Link href={`/u/${r.profiles!.username}`} className="text-sm text-muted hover:text-ink">
                  @{r.profiles!.username}
                </Link>
              </span>
            </StaggerItem>
          );
        })}
      </StaggerList>
    </section>
  );
}

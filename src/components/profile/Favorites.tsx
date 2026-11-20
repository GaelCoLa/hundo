// Top 5 del perfil: las portadas en el orden que eligió el jugador, con su
// puesto en grande y la nota que les puso. Si no eligió ninguno, no se muestra.
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getScaleCategory } from "@/lib/scale";
import { Cover } from "@/components/games/Cover";
import { TiltCard } from "@/components/motion/TiltCard";
import { StaggerItem, StaggerList } from "@/components/motion/Stagger";

export type FavoriteEntry = { position: number; slug: string; name: string; coverImageId: string | null; score: number | null };

export async function Favorites({ items }: { items: FavoriteEntry[] }) {
  if (items.length === 0) return null;
  const t = await getTranslations("profile");
  return (
    <section aria-labelledby="top5" className="flex flex-col gap-5">
      <h2 id="top5" className="font-display text-4xl font-black uppercase">
        {t("top5")}
      </h2>
      <StaggerList className="grid grid-cols-3 gap-4 sm:grid-cols-5">
        {items.map((f) => {
          const category = f.score !== null ? getScaleCategory(f.score) : null;
          return (
            <StaggerItem key={f.position} className="flex flex-col gap-2">
              <Link href={`/games/${f.slug}`} className="group relative block rounded-xl">
                <TiltCard>
                  <Cover imageId={f.coverImageId} name={f.name} size="t_cover_big" className="transition-shadow duration-300 group-hover:ring-2 group-hover:ring-accent" />
                  <span className="absolute -left-2 -top-3 font-display text-5xl font-black text-accent drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] [transform:translateZ(30px)]">
                    {f.position}
                  </span>
                </TiltCard>
              </Link>
              <span className="flex items-start justify-between gap-2">
                <span className="line-clamp-2 text-sm font-semibold leading-tight">{f.name}</span>
                {category ? (
                  <span className="font-display text-2xl font-black leading-none" style={{ color: category.color }}>
                    {f.score}
                  </span>
                ) : null}
              </span>
            </StaggerItem>
          );
        })}
      </StaggerList>
    </section>
  );
}

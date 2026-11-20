// Collage de portadas reales que flotan alrededor de la tarjeta de ejemplo de la
// portada del sitio. Son los juegos más calificados de Hundo; si todavía no hay
// ninguno, no se muestra nada. Decorativas: cada una es un link al juego, pero
// están detrás de la tarjeta y solo en pantallas grandes.
import { Link } from "@/i18n/navigation";
import { Cover } from "@/components/games/Cover";
import { getFeaturedCovers } from "@/lib/featured-covers";

// Posición, tamaño, rotación y retraso de cada portada (hasta 5).
const SPOTS = [
  { pos: "-left-16 -top-10", w: "w-24", r: "-10deg", d: "0s" },
  { pos: "-right-12 -top-14", w: "w-28", r: "8deg", d: "1.2s" },
  { pos: "-right-20 top-1/2", w: "w-24", r: "12deg", d: "2.1s" },
  { pos: "-bottom-14 -left-10", w: "w-28", r: "6deg", d: "0.6s" },
  { pos: "-bottom-16 right-10", w: "w-20", r: "-8deg", d: "1.7s" },
];

export async function FloatingCovers() {
  const covers = await getFeaturedCovers(SPOTS.length);
  if (covers.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
      {covers.map((c, i) => {
        const s = SPOTS[i]!;
        return (
          <Link
            key={c.slug}
            href={`/games/${c.slug}`}
            tabIndex={-1}
            aria-hidden="true"
            className={`pointer-events-auto absolute ${s.pos} ${s.w} animate-float opacity-80 transition-opacity hover:opacity-100 motion-reduce:animate-none`}
            style={{ "--r": s.r, animationDelay: s.d } as React.CSSProperties}
          >
            <Cover imageId={c.coverImageId} name={c.name} size="t_cover_big" className="shadow-[0_20px_40px_-16px_rgba(0,0,0,0.9)] ring-1 ring-white/10" />
          </Link>
        );
      })}
    </div>
  );
}

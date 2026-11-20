import type { IgdbGame } from "@/lib/igdb/map";
import { Link } from "@/i18n/navigation";
import { Cover } from "./Cover";
import { TiltCard } from "@/components/motion/TiltCard";

/** Tarjeta de un resultado de búsqueda: portada, nombre y año. */
export function GameCard({ game }: { game: IgdbGame }) {
  return (
    <Link href={`/games/${game.slug}`} className="group flex flex-col gap-2 rounded-xl">
      <TiltCard>
        <Cover imageId={game.coverImageId} name={game.name} size="t_cover_big" className="transition-shadow duration-300 group-hover:shadow-[0_18px_36px_-14px_rgba(0,0,0,0.9)] group-hover:ring-2 group-hover:ring-accent" />
      </TiltCard>
      <span className="flex flex-col">
        <span className="line-clamp-2 font-semibold leading-tight">{game.name}</span>
        {game.releaseYear ? <span className="text-sm text-muted">{game.releaseYear}</span> : null}
      </span>
    </Link>
  );
}

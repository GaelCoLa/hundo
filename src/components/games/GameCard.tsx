import type { IgdbGame } from "@/lib/igdb/map";
import { Link } from "@/i18n/navigation";
import { Cover } from "./Cover";

/** Tarjeta de un resultado de búsqueda: portada, nombre y año. */
export function GameCard({ game }: { game: IgdbGame }) {
  return (
    <Link href={`/games/${game.slug}`} className="group flex flex-col gap-2 rounded-xl">
      <Cover imageId={game.coverImageId} name={game.name} size="t_cover_big" className="transition group-hover:ring-2 group-hover:ring-accent" />
      <span className="flex flex-col">
        <span className="line-clamp-2 font-semibold leading-tight">{game.name}</span>
        {game.releaseYear ? <span className="text-sm text-muted">{game.releaseYear}</span> : null}
      </span>
    </Link>
  );
}

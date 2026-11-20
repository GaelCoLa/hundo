// Fila de un ranking: puesto, portada chica, nombre, año, nota de la comunidad
// en el color de su categoría y cuántos votos válidos la sostienen.
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getScaleCategory } from "@/lib/scale";
import type { GameRow } from "@/lib/games";
import { Cover } from "./Cover";

type Props = { game: GameRow; position: number; /** Qué número destacar a la derecha. */ metric?: "score" | "reviews" };

export function RankedGameRow({ game, position, metric = "score" }: Props) {
  const t = useTranslations("explore");
  const category = game.communityScore !== null ? getScaleCategory(game.communityScore) : null;
  return (
    <Link
      href={`/games/${game.slug}`}
      className="flex items-center gap-4 rounded-[14px] bg-surface p-3 transition duration-200 hover:translate-x-1 hover:ring-2 hover:ring-line"
    >
      <span className="w-8 shrink-0 text-right font-display text-3xl font-black text-muted">{position}</span>
      <Cover imageId={game.coverImageId} name={game.name} size="t_cover_small" className="w-12 shrink-0" />
      <span className="flex min-w-0 grow flex-col">
        <span className="truncate font-semibold leading-tight">{game.name}</span>
        <span className="text-sm text-muted">
          {[game.releaseYear, metric === "score" ? t("votes", { count: game.validRatingsCount }) : t("reviewsCount", { count: game.reviewsCount })]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
      <span className="font-display text-4xl font-black leading-none" style={{ color: category?.color }}>
        {game.communityScore ?? "—"}
      </span>
    </Link>
  );
}

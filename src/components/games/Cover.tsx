// Portada de un juego. next/image la optimiza (tamaño justo, formato moderno, caché).
// Si IGDB no tiene portada, mostramos un recuadro con las iniciales del juego.
import Image from "next/image";
import { coverUrl } from "@/lib/igdb/map";

const SIZES = {
  t_cover_big: { width: 264, height: 352 },
  t_cover_small: { width: 90, height: 120 },
} as const;

type Props = {
  imageId: string | null;
  name: string;
  size: keyof typeof SIZES;
  className?: string;
  priority?: boolean;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function Cover({ imageId, name, size, className = "", priority = false }: Props) {
  const { width, height } = SIZES[size];
  const url = coverUrl(imageId, size);
  const box = `aspect-[3/4] overflow-hidden rounded-lg bg-line ${className}`;

  if (!url) {
    return (
      <div aria-hidden="true" className={`${box} flex items-center justify-center font-display text-2xl font-black text-muted`}>
        {initials(name)}
      </div>
    );
  }
  return (
    <div className={box}>
      <Image src={url} alt="" width={width} height={height} priority={priority} className="size-full object-cover" />
    </div>
  );
}

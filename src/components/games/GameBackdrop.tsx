// Fondo de la ficha de un juego: la portada, ampliada y muy difuminada, ocupa
// todo el ancho detrás del encabezado y se funde con el fondo del sitio.
// Así cada juego tiene "su" color sin calcular nada: el desenfoque mezcla los
// colores de la portada. Es decorativo (aria-hidden) y no recibe clics.
import Image from "next/image";
import { coverUrl } from "@/lib/igdb/map";

export function GameBackdrop({ imageId }: { imageId: string | null }) {
  const url = coverUrl(imageId, "t_cover_big");
  if (!url) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-[-140px] -z-10 h-[760px] w-screen -translate-x-1/2 overflow-hidden"
    >
      <Image
        src={url}
        alt=""
        fill
        sizes="100vw"
        priority
        className="animate-backdrop-in scale-125 object-cover opacity-45 blur-3xl saturate-150 motion-reduce:animate-none"
      />
      {/* Degradado: de transparente arriba al color de fondo abajo, para que no haya corte. */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg/30 via-bg/60 to-bg" />
    </div>
  );
}

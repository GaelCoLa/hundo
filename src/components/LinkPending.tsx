"use client";
// Indicador de "cargando" para un link: va ADENTRO del <Link> (como último
// hijo) y, mientras la página nueva se está trayendo del servidor, cubre el
// botón con un brillo que late. useLinkStatus (de Next) dice si ESTE link está
// pendiente. Así el clic se nota al instante, aunque los datos tarden.
// El link tiene que tener la clase "relative" para que el brillo lo cubra.
import { useLinkStatus } from "next/link";

export function LinkPending() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 rounded-[inherit] bg-ink/25 transition-opacity duration-150 ${
        pending ? "animate-pulse opacity-100" : "opacity-0"
      }`}
    />
  );
}

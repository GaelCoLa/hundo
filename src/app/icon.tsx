// Ícono de la pestaña del navegador (favicon). Next lo genera como PNG al
// compilar y agrega el <link rel="icon"> en todas las páginas.
import { ImageResponse } from "next/og";
import { BrandIcon } from "@/lib/brand-icon";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<BrandIcon size={64} rounded />, size);
}

"use client";
// Configuración global de Motion. reducedMotion="user": si la persona activó
// "reducir movimiento" en Windows, macOS o el celular, Motion no anima
// desplazamientos ni escalas. Es una regla de accesibilidad: a algunas personas
// el movimiento en pantalla les causa mareos.
import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

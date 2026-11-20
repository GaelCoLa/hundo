"use client";
// Revela su contenido de izquierda a derecha la primera vez que entra en pantalla
// (como una cortina que se corre). Se usa en las barras de colores de la escala
// y de "cómo lo calificaron". Anima clip-path: recorta lo visible sin mover nada,
// así no cambia el tamaño de la página mientras se anima.
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      // "initial" tiene que ser igual en el servidor y en el navegador (el servidor
      // no sabe si la persona pidió reducir movimiento). Lo que cambia es la duración.
      initial={{ clipPath: "inset(0 100% 0 0 round 999px)" }}
      whileInView={{ clipPath: "inset(0 0% 0 0 round 999px)" }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={reduce ? { duration: 0 } : { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

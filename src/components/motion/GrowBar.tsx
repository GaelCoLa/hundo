"use client";
// Una barra horizontal que crece desde 0 hasta su ancho final al entrar en
// pantalla. "index" escalona las barras: cada una arranca un poquito después
// que la anterior, y se ven llenarse en cascada.
import { motion, useReducedMotion } from "motion/react";

type Props = { percent: number; color: string; index?: number };

export function GrowBar({ percent, color, index = 0 }: Props) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className="block h-full origin-left rounded-full"
      style={{ width: `${percent}%`, background: color }}
      // scaleX en vez de width: animar transformaciones es más barato para el
      // navegador que recalcular anchos en cada cuadro.
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20, delay: index * 0.07 }}
    />
  );
}

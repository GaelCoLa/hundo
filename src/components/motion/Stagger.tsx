"use client";
// Listas que aparecen en cascada: cada elemento sube y aparece un instante
// después del anterior. Usa "variants" de Motion: el padre (StaggerList) solo
// dice "mostrate" y reparte el retraso entre sus hijos (StaggerItem).
import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const instantList: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
};

export function StaggerList({ children, className }: { children: ReactNode; className?: string }) {
  // Con "reducir movimiento" todo aparece al instante (sin retrasos ni subida).
  const reduce = useReducedMotion();
  return (
    <motion.ul
      className={className}
      variants={reduce ? instantList : list}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-5% 0px" }}
    >
      {children}
    </motion.ul>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.li className={className} variants={item}>
      {children}
    </motion.li>
  );
}

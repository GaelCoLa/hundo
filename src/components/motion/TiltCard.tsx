"use client";
// Efecto "tarjeta coleccionable": al mover el mouse encima, la portada se inclina
// en 3D hacia el cursor y un reflejo de luz la recorre.
//
// Cómo funciona:
// - La posición del mouse dentro de la tarjeta se guarda en dos motion values
//   (x e y, de 0 a 1). Con useTransform se convierten en grados de rotación.
// - useSpring suaviza esos valores: la tarjeta "persigue" al cursor con inercia
//   en vez de saltar, y al salir vuelve sola a su lugar.
// - perspective en el contenedor es lo que hace que la rotación se vea en 3D.
// Solo reacciona al mouse (no al dedo en el celular, donde molestaría al
// desplazarse), y se apaga con "reducir movimiento".
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import type { PointerEvent, ReactNode } from "react";

const MAX_TILT = 12; // grados

export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const hover = useMotionValue(0);

  const spring = { stiffness: 220, damping: 18, mass: 0.6 };
  const rotateY = useSpring(useTransform(x, [0, 1], [-MAX_TILT, MAX_TILT]), spring);
  const rotateX = useSpring(useTransform(y, [0, 1], [MAX_TILT, -MAX_TILT]), spring);
  const scale = useSpring(useTransform(hover, [0, 1], [1, 1.04]), spring);
  const shineOpacity = useSpring(hover, spring);

  // El reflejo: un brillo circular que sigue al cursor.
  const shineX = useTransform(x, (v) => `${v * 100}%`);
  const shineY = useTransform(y, (v) => `${v * 100}%`);
  const shine = useMotionTemplate`radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.35), transparent 55%)`;

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width);
    y.set((e.clientY - r.top) / r.height);
    hover.set(1);
  }

  function onLeave() {
    x.set(0.5);
    y.set(0.5);
    hover.set(0);
  }

  return (
    <div className={`[perspective:800px] ${className}`} onPointerMove={onMove} onPointerLeave={onLeave}>
      <motion.div className="relative rounded-lg" style={{ rotateX, rotateY, scale, transformStyle: "preserve-3d" }}>
        {children}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-lg mix-blend-overlay"
          style={{ background: shine, opacity: shineOpacity }}
        />
      </motion.div>
    </div>
  );
}

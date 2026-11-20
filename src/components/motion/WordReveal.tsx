"use client";
// Titular que aparece palabra por palabra: cada palabra sube desde abajo de una
// "ventana" (overflow-hidden) y aparece un instante después de la anterior.
// El texto completo sigue siendo un solo encabezado para lectores de pantalla.
import { Fragment } from "react";
import { motion, useReducedMotion } from "motion/react";

export function WordReveal({ text, className }: { text: string; className?: string }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  return (
    <h1 className={className} aria-label={text}>
      {words.map((word, i) => (
        <Fragment key={i}>
          {/* pt/-mt: deja lugar a los acentos ("TERMINÁS") sin que la ventana los corte. */}
          <span aria-hidden="true" className="-mt-[0.15em] inline-block overflow-hidden pt-[0.15em] align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 18, delay: 0.1 + i * 0.08 }}
            >
              {word}
            </motion.span>
          </span>
          {/* Espacio común entre palabras: permite que el titular corte de línea. */}
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </h1>
  );
}

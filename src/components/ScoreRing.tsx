"use client";
// Anillo de nota: el arco ocupa el porcentaje de la nota, en el color de su categoría.
// Se dibuja con CSS (conic-gradient), sin imágenes.
//
// Animación (Motion): al aparecer en pantalla, un "valor animado" (motion value)
// va de 0 a la nota. De ese único valor salen el arco y el número, así los dos
// avanzan juntos. Los motion values cambian el estilo directo en el navegador,
// sin volver a renderizar el componente de React en cada cuadro: por eso es fluido.
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { getScaleCategory } from "@/lib/scale";

type Props = {
  score: number;
  /** Diámetro en píxeles. */
  size?: number;
  /** Color del centro y del tramo vacío, para que combine con el fondo de la tarjeta. */
  innerColor?: string;
  trackColor?: string;
};

export function ScoreRing({ score, size = 148, innerColor = "#182038", trackColor = "#2c3654" }: Props) {
  const t = useTranslations("scale");
  const category = getScaleCategory(score);
  const thickness = Math.round(size * 0.1);

  const ref = useRef<HTMLDivElement>(null);
  // once: anima la primera vez que se ve; "-10%": espera a que entre un poco.
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();

  const progress = useMotionValue(0);
  const background = useTransform(
    progress,
    (p) => `conic-gradient(${category.color} 0 ${p}%, ${trackColor} ${p}% 100%)`,
  );
  const shown = useTransform(progress, (p) => Math.round(p));

  useEffect(() => {
    if (reduce) {
      progress.set(score);
      return;
    }
    if (!inView) return;
    // Arranca rápido y frena al final (easeOut): se siente como algo que "llega".
    const controls = animate(progress, score, { duration: 1.2, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, reduce, score, progress]);

  return (
    <motion.div
      ref={ref}
      role="img"
      aria-label={t("ringLabel", { score, category: t(category.key) })}
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background }}
    >
      <div
        className="flex items-center justify-center rounded-full font-display font-black text-white"
        style={{
          width: size - thickness * 2,
          height: size - thickness * 2,
          background: innerColor,
          fontSize: Math.round(size * 0.46),
        }}
      >
        <motion.span aria-hidden="true">{shown}</motion.span>
      </div>
    </motion.div>
  );
}

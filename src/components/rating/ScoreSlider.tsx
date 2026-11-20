"use client";
// Barra del 1 al 100. Mientras la movés, el número cambia de color y muestra
// su categoría ("92 · Excelente") y su equivalente sobre 10.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { getScaleCategory, toTen } from "@/lib/scale";

export function ScoreSlider({ defaultValue = 75 }: { defaultValue?: number }) {
  const t = useTranslations("scale");
  const tr = useTranslations("rating");
  const [score, setScore] = useState(defaultValue);
  const category = getScaleCategory(score);
  const label = t(category.key);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor="score" className="font-semibold">
          {tr("scoreLabel")}
        </label>
        <span className="text-sm text-muted">{t("outOfTen", { value: toTen(score) })}</span>
      </div>
      <div className="flex items-baseline gap-3" aria-hidden="true">
        {/* El color cambia con una transición suave (CSS). Al pasar a otra
            categoría, la key cambia y Motion hace "saltar" el número. */}
        <motion.span
          key={category.key}
          initial={{ scale: 1.18 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
          className="inline-block origin-bottom-left font-display text-[84px] font-black leading-[0.9] transition-colors duration-300"
          style={{ color: category.color }}
        >
          {score}
        </motion.span>
        {/* El nombre de la categoría entra desde abajo y el anterior sale hacia arriba. */}
        <span className="relative inline-flex overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={category.key}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="font-display text-3xl font-extrabold"
              style={{ color: category.color }}
            >
              {label}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
      <input
        id="score"
        name="score"
        type="range"
        min={1}
        max={100}
        step={1}
        value={score}
        onChange={(e) => setScore(Number(e.target.value))}
        aria-valuetext={`${score}, ${label}`}
        className="h-3 w-full cursor-pointer appearance-none rounded-full bg-line"
        style={{
          background: `linear-gradient(to right, ${category.color} 0 ${score}%, var(--color-line) ${score}% 100%)`,
          accentColor: category.color,
        }}
      />
    </div>
  );
}

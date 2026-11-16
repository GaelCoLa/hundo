"use client";
// Barra del 1 al 100. Mientras la movés, el número cambia de color y muestra
// su categoría ("92 · Excelente") y su equivalente sobre 10.
import { useState } from "react";
import { useTranslations } from "next-intl";
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
        <span className="font-display text-[84px] font-black leading-[0.9]" style={{ color: category.color }}>
          {score}
        </span>
        <span className="font-display text-3xl font-extrabold" style={{ color: category.color }}>
          {label}
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

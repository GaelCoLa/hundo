// Anillo de nota: el arco ocupa el porcentaje de la nota, en el color de su categoría.
// Se dibuja con CSS (conic-gradient), sin imágenes ni librerías.
import { useTranslations } from "next-intl";
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

  return (
    <div
      role="img"
      aria-label={t("ringLabel", { score, category: t(category.key) })}
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${category.color} 0 ${score}%, ${trackColor} ${score}% 100%)`,
      }}
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
        {score}
      </div>
    </div>
  );
}

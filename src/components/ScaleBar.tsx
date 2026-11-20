// La escala completa: una barra con un tramo por categoría (ancho proporcional a su
// rango) y debajo una leyenda legible. Los tramos de 5 puntos son muy finos para
// llevar texto, por eso los nombres van en la leyenda y no dentro de la barra.
import { useTranslations } from "next-intl";
import { SCALE } from "@/lib/scale";
import { Reveal } from "@/components/motion/Reveal";

export function ScaleBar() {
  const t = useTranslations("scale");
  return (
    <div className="flex flex-col gap-4">
      <Reveal className="flex h-3 gap-1 overflow-hidden rounded-full">
        <div aria-hidden="true" className="contents">
          {SCALE.map((c) => (
            <div key={c.key} style={{ flex: c.max - c.min + 1, background: c.color }} />
          ))}
        </div>
      </Reveal>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 lg:grid-cols-7">
        {SCALE.map((c) => (
          <li key={c.key} className="flex items-start gap-2">
            <span aria-hidden="true" className="mt-1 size-3 shrink-0 rounded-sm" style={{ background: c.color }} />
            <span className="flex flex-col">
              <span className="text-sm font-semibold">{t(c.key)}</span>
              <span className="text-xs text-muted">{t("range", { min: c.min, max: c.max })}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

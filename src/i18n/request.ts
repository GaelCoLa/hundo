// next-intl llama a esta función en cada render del servidor para saber
// qué idioma usar y qué textos cargar.
//
// El idioma sale del segmento [locale] de la URL, leído con `next/root-params`
// (la forma nueva de Next 16). En Server Actions eso no está disponible, así
// que ahí pasamos el idioma a mano: getTranslations({ locale, namespace }).
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import * as rootParams from "next/root-params";
import { notFound } from "next/navigation";
import { routing } from "./routing";

export default getRequestConfig(async ({ locale: explicitLocale }) => {
  const candidate = explicitLocale ?? (await rootParams.locale());
  if (!hasLocale(routing.locales, candidate)) notFound();

  return {
    locale: candidate,
    messages: (await import(`../../messages/${candidate}.json`)).default,
  };
});

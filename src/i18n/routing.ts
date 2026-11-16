// Idiomas de Hundo. Todas las páginas viven bajo /en/... o /es/...
// Si alguien entra a "/", el proxy lo redirige al idioma de su navegador.
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
});

export type Locale = (typeof routing.locales)[number];

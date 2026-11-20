// Layout raíz: envuelve todas las páginas. Vive dentro de [locale] para que
// cada idioma tenga su propia versión (y <html lang> correcto).
import type { Metadata } from "next";
import { Big_Shoulders, Figtree, Unbounded } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { locale } from "next/root-params";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/SiteHeader";
import { MotionProvider } from "@/components/motion/MotionProvider";
import "../globals.css";

// next/font descarga las fuentes al compilar y las sirve desde nuestro dominio:
// más rápido y sin pedirle nada a Google desde el navegador del visitante.
const bigShoulders = Big_Shoulders({
  subsets: ["latin"],
  weight: ["800", "900"],
  variable: "--font-big-shoulders",
  // Google no publica métricas de reemplazo para esta fuente; evitamos el aviso.
  adjustFontFallback: false,
});
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });
const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-unbounded",
});

// Con Cache Components cada idioma se pre-genera al compilar.
export function generateStaticParams() {
  return routing.locales.map((l) => ({ locale: l }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("title"), description: t("description") };
}

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const lang = await locale();
  return (
    <html
      lang={lang}
      className={`${bigShoulders.variable} ${figtree.variable} ${unbounded.variable}`}
    >
      <body className="min-h-dvh overflow-x-clip antialiased">
        <NextIntlClientProvider>
          <MotionProvider>
            <SiteHeader />
            {children}
          </MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

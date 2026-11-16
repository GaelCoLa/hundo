// Portada provisoria: se reemplaza por el diseño completo en la Tarea 5.
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("home");
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-16">
      <h1 className="font-display text-6xl font-black uppercase leading-[0.9]">{t("title")}</h1>
      <p className="mt-6 max-w-xl text-lg text-soft">{t("subtitle")}</p>
    </main>
  );
}

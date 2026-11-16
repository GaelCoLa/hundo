// Página 404 con el diseño de Hundo, para juegos o perfiles que no existen.
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-20 pt-10 sm:px-8">
      <p className="font-display text-[120px] font-black leading-none text-accent">404</p>
      <h1 className="font-display text-6xl font-black uppercase leading-[0.9]">{t("title")}</h1>
      <p className="text-lg text-soft">{t("body")}</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/games" className="flex h-12 items-center rounded-xl bg-accent px-6 font-bold text-accent-ink">
          {t("search")}
        </Link>
        <Link href="/" className="flex h-12 items-center rounded-xl border-2 border-line px-6 font-semibold">
          {t("back")}
        </Link>
      </div>
    </main>
  );
}

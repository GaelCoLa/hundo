import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** Página provisoria para secciones que llegan en la Fase 2 y 3. */
export function ComingSoon({ section }: { section: string }) {
  const t = useTranslations("comingSoon");
  const tn = useTranslations("notFound");
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-20 pt-10 sm:px-8">
      <p className="text-sm font-semibold text-accent">{section}</p>
      <h1 className="font-display text-6xl font-black uppercase leading-[0.9]">{t("title")}</h1>
      <p className="text-lg text-soft">{t("body")}</p>
      <Link href="/" className="font-semibold underline underline-offset-4">{tn("back")}</Link>
    </main>
  );
}

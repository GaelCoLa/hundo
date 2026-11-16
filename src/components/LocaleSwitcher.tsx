"use client";
// Cambia de idioma manteniendo la página actual: /en/settings ↔ /es/settings.
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("nav");
  const current = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={t("language")} className="flex rounded-[10px] bg-surface p-1 text-sm font-semibold">
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          aria-current={l === current ? "true" : undefined}
          className={`rounded-lg px-2.5 py-1.5 uppercase ${l === current ? "bg-line text-ink" : "text-muted hover:text-ink"}`}
        >
          {l}
        </Link>
      ))}
    </nav>
  );
}

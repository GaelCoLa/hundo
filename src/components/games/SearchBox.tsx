// Buscador de juegos. Es un <form> común que manda a /games?q=...: funciona
// incluso sin JavaScript y la búsqueda queda en la URL (se puede compartir).
import { getTranslations } from "next-intl/server";
import { locale } from "next/root-params";

type Props = { defaultValue?: string; variant?: "header" | "page" };

export async function SearchBox({ defaultValue = "", variant = "page" }: Props) {
  const [t, lang] = await Promise.all([getTranslations("search"), locale()]);
  const big = variant === "page";

  return (
    <form action={`/${lang}/games`} method="get" role="search" className={big ? "w-full max-w-2xl" : "w-full sm:w-64"}>
      <label
        className={`flex items-center gap-2.5 rounded-[10px] bg-surface px-3.5 text-muted focus-within:ring-2 focus-within:ring-accent ${big ? "h-14" : "h-11"}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <span className="sr-only">{t("label")}</span>
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={t("placeholder")}
          maxLength={100}
          className={`w-full bg-transparent text-ink outline-none placeholder:text-muted ${big ? "text-lg" : "text-sm"}`}
        />
      </label>
    </form>
  );
}

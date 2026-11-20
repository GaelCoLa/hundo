// Cabecera del sitio. El logo, la navegación y el idioma son estáticos y se
// pre-generan; solo el botón de cuenta depende de la sesión y por eso carga
// aparte, dentro de <Suspense>, sin frenar el resto de la página.
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { locale } from "next/root-params";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logOut } from "@/app/[locale]/(auth)/actions";
import { Logo } from "./Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { SearchBox } from "./games/SearchBox";
import { AccountMenu } from "./AccountMenu";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-4 px-4 py-6 sm:px-8">
      <Link href="/" aria-label={t("home")} className="rounded-xl">
        <Logo />
      </Link>
      <nav className="order-last flex w-full gap-6 text-[15px] font-medium sm:order-none sm:w-auto sm:flex-1">
        <Link href="/games" className="text-soft hover:text-ink">{t("games")}</Link>
        <Link href="/reviews" className="text-soft hover:text-ink">{t("reviews")}</Link>
        <Link href="/players" className="text-soft hover:text-ink">{t("players")}</Link>
      </nav>
      <div className="ml-auto flex items-center gap-3 sm:ml-0">
        <div className="hidden md:block">
          <SearchBox variant="header" />
        </div>
        {/* Lee la URL actual: en páginas con partes variables (/games/[slug]) eso es dato de cada visita. */}
        <Suspense fallback={<div className="h-11 w-[88px] rounded-[10px] bg-surface" />}>
          <LocaleSwitcher />
        </Suspense>
        <Suspense fallback={<div className="h-11 w-24 rounded-[10px] bg-surface" />}>
          <AccountButton />
        </Suspense>
      </div>
    </header>
  );
}

async function AccountButton() {
  const [t, user, lang] = await Promise.all([getTranslations("nav"), getCurrentUser(), locale()]);

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex h-11 items-center rounded-[10px] bg-accent px-5 font-bold text-accent-ink btn-pop"
      >
        {t("signIn")}
      </Link>
    );
  }

  return (
    <AccountMenu
      label={t("accountMenu")}
      summary={
        <>
          <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-lg bg-accent text-sm font-bold uppercase text-accent-ink">
            {user.username[0]}
          </span>
          @{user.username}
        </>
      }
    >
      <Link href={`/u/${user.username}`} className="rounded-lg px-3 py-2.5 hover:bg-line">{t("myProfile")}</Link>
      <Link href="/settings" className="rounded-lg px-3 py-2.5 hover:bg-line">{t("settings")}</Link>
      <form action={logOut.bind(null, lang)}>
        <button type="submit" className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-line">
          {t("logOut")}
        </button>
      </form>
    </AccountMenu>
  );
}

// Configuración de la cuenta. Por ahora muestra los datos básicos; en fases
// siguientes se suma editar perfil, idioma y borrar la cuenta.
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { locale } from "next/root-params";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:py-20">
      <h1 className="font-display text-5xl font-black uppercase leading-[0.9]">{t("title")}</h1>
      {/* Leer la sesión depende del pedido, así que va dentro de <Suspense>. */}
      <Suspense fallback={<div className="h-32 rounded-[20px] bg-surface" aria-busy="true" />}>
        <AccountDetails />
      </Suspense>
    </main>
  );
}

async function AccountDetails() {
  const lang = await locale();
  const user = await getCurrentUser();
  if (!user) redirect(`/${lang}/login?next=/settings`);

  const t = await getTranslations("settings");
  return (
    <dl className="grid gap-4 rounded-[20px] bg-surface p-6 sm:grid-cols-2 sm:p-8">
      <div>
        <dt className="text-sm text-muted">{t("username")}</dt>
        <dd className="mt-1 text-lg font-semibold">@{user.username}</dd>
      </div>
      <div>
        <dt className="text-sm text-muted">{t("email")}</dt>
        <dd className="mt-1 text-lg font-semibold break-all">{user.email}</dd>
      </div>
    </dl>
  );
}

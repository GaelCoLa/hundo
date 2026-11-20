// Configuración de la cuenta: datos básicos y editar el perfil (foto, nombre
// visible, bio).
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { locale } from "next/root-params";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { ProfileForm } from "@/components/settings/ProfileForm";

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

  const [t, supabase] = await Promise.all([getTranslations("settings"), createClient()]);
  const { data: profile } = await supabase.from("profiles").select("display_name, bio").eq("id", user.id).single();
  return (
    <>
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
      <ProfileForm
        avatar={<Avatar username={user.username} avatarPath={user.avatarUrl} size={80} className="rounded-[22px] text-3xl" />}
        hasAvatar={user.avatarUrl !== null}
        displayName={profile?.display_name ?? null}
        bio={profile?.bio ?? null}
      />
    </>
  );
}

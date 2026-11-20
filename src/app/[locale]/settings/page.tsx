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
import { FavoritesForm } from "@/components/settings/FavoritesForm";
import { DeleteAccount } from "@/components/settings/DeleteAccount";

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
  const [{ data: profile }, { data: rated }, { data: favorites }] = await Promise.all([
    supabase.from("profiles").select("display_name, bio").eq("id", user.id).single(),
    // Juegos calificados, para elegir el Top 5 (orden alfabético).
    supabase.from("ratings").select("game_id, games(name)").eq("user_id", user.id).returns<{ game_id: number; games: { name: string } | null }[]>(),
    supabase.from("favorites").select("game_id").eq("user_id", user.id).order("position"),
  ]);
  const options = (rated ?? [])
    .filter((r) => r.games)
    .map((r) => ({ id: r.game_id, name: r.games!.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
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
        avatar={<Avatar username={user.username} ownerId={user.id} avatarPath={user.avatarUrl} size={80} className="rounded-[22px] text-3xl" />}
        hasAvatar={user.avatarUrl !== null}
        displayName={profile?.display_name ?? null}
        bio={profile?.bio ?? null}
      />
      <FavoritesForm options={options} current={(favorites ?? []).map((f) => f.game_id as number)} />
      <DeleteAccount username={user.username} lang={lang} />
    </>
  );
}

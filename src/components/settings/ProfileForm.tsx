"use client";
// Editar el perfil: foto (se sube apenas la elegís) y, aparte, nombre visible y
// bio con su botón Guardar. Mismo patrón que el formulario de calificar:
// useActionState guarda el resultado de la acción (error o "guardado").
import { useActionState, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { removeAvatar, updateAvatar, updateProfile, type AvatarState, type ProfileState } from "@/app/[locale]/settings/actions";
import { FormError } from "@/components/auth/AuthFields";
import { MAX_AVATAR_BYTES } from "@/lib/profile-input";

type Props = {
  avatar: React.ReactNode;
  hasAvatar: boolean;
  displayName: string | null;
  bio: string | null;
};

function Saved({ text }: { text: string }) {
  return (
    <motion.p
      role="status"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 text-sm font-semibold text-scale-great"
    >
      <span aria-hidden="true">✓</span>
      {text}
    </motion.p>
  );
}

export function ProfileForm({ avatar, hasAvatar, displayName, bio }: Props) {
  const t = useTranslations("settings");
  const [avatarState, avatarAction, avatarPending] = useActionState<AvatarState, FormData>(updateAvatar, {});
  const [profileState, profileAction, profilePending] = useActionState<ProfileState, FormData>(updateProfile, {});
  const [bioLength, setBioLength] = useState(bio?.length ?? 0);
  const avatarForm = useRef<HTMLFormElement>(null);
  const input = "h-11 rounded-[10px] border border-line bg-bg px-3 text-[15px] text-ink";

  return (
    <section aria-labelledby="profile-edit" className="flex flex-col gap-6 rounded-[20px] bg-surface p-6 sm:p-8">
      <h2 id="profile-edit" className="text-lg font-semibold">
        {t("profileTitle")}
      </h2>

      <form ref={avatarForm} action={avatarAction} className="flex flex-wrap items-center gap-4">
        {avatar}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <label className={`btn-pop btn-pop-ghost inline-flex h-10 cursor-pointer items-center rounded-xl border-2 border-line px-4 font-semibold ${avatarPending ? "opacity-60" : ""}`}>
              {avatarPending ? t("uploading") : t("changePhoto")}
              <input
                type="file"
                name="avatar"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                disabled={avatarPending}
                // Se envía apenas se elige el archivo (sin botón extra).
                onChange={(e) => {
                  if (e.target.files?.[0]) avatarForm.current?.requestSubmit();
                }}
              />
            </label>
            {hasAvatar ? (
              <button type="submit" formAction={removeAvatar} className="h-10 rounded-xl px-3 text-sm font-semibold text-soft hover:text-ink">
                {t("removePhoto")}
              </button>
            ) : null}
          </div>
          <p className="text-xs text-muted">{t("photoHint", { mb: MAX_AVATAR_BYTES / 1024 / 1024 })}</p>
          {avatarState.error ? <FormError>{t(`errors.${avatarState.error}`)}</FormError> : null}
          {avatarState.saved && !avatarPending ? <Saved text={t("photoSaved")} /> : null}
        </div>
      </form>

      <form action={profileAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm text-muted">
          {t("displayName")}
          <input name="displayName" defaultValue={displayName ?? ""} maxLength={40} placeholder={t("displayNamePlaceholder")} className={input} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-muted">
          <span className="flex justify-between">
            {t("bio")}
            <span className="tabular-nums">{bioLength}/300</span>
          </span>
          <textarea
            name="bio"
            rows={3}
            maxLength={300}
            defaultValue={bio ?? ""}
            placeholder={t("bioPlaceholder")}
            onChange={(e) => setBioLength(e.target.value.length)}
            className="rounded-[10px] border border-line bg-bg px-3 py-2.5 text-[15px] leading-relaxed text-ink"
          />
        </label>
        {profileState.error ? <FormError>{t(`errors.${profileState.error}`)}</FormError> : null}
        {profileState.saved && !profilePending ? <Saved text={t("profileSaved")} /> : null}
        <button
          type="submit"
          disabled={profilePending}
          className="btn-pop h-12 self-start rounded-xl bg-accent px-6 font-bold text-accent-ink disabled:opacity-60"
        >
          {t("save")}
        </button>
      </form>
    </section>
  );
}

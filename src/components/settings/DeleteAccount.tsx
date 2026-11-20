"use client";
// "Zona peligrosa": borrar la cuenta. Para evitar accidentes, el botón se
// habilita recién cuando escribís tu nombre de usuario (y el servidor lo vuelve
// a comprobar: nunca confiamos solo en lo que hace el navegador).
import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { deleteAccount, type DeleteState } from "@/app/[locale]/settings/actions";
import { FormError } from "@/components/auth/AuthFields";
import { confirmMatches } from "@/lib/profile-input";

export function DeleteAccount({ username, lang }: { username: string; lang: string }) {
  const t = useTranslations("settings");
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteAccount.bind(null, lang), {});
  const [typed, setTyped] = useState("");
  const ready = confirmMatches(typed, username);

  return (
    <section aria-labelledby="danger" className="flex flex-col gap-4 rounded-[20px] border-2 border-scale-mediocre/60 p-6 sm:p-8">
      <h2 id="danger" className="text-lg font-semibold text-scale-mediocre">
        {t("dangerTitle")}
      </h2>
      <p className="text-soft">{t("deleteExplain")}</p>
      <form action={action} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-sm text-muted">
          {t("deleteConfirmLabel", { username })}
          <input
            name="confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="h-11 rounded-[10px] border border-line bg-bg px-3 text-[15px] text-ink"
          />
        </label>
        {state.error ? <FormError>{t(`errors.${state.error}`)}</FormError> : null}
        <button
          type="submit"
          disabled={!ready || pending}
          className="h-12 self-start rounded-xl bg-scale-mediocre px-6 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? t("deleting") : t("deleteButton")}
        </button>
      </form>
    </section>
  );
}

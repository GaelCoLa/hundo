"use client";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { logIn, resendConfirmation, type AuthState } from "@/app/[locale]/(auth)/actions";
import { Link } from "@/i18n/navigation";
import { Field, FormError, SubmitButton } from "./AuthFields";

export function LogInForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    logIn.bind(null, locale),
    {},
  );
  // El mismo formulario tiene un segundo botón que reenvía la confirmación
  // usando el email que la persona ya escribió (atributo formAction).
  const [resendState, resendAction, resending] = useActionState<AuthState, FormData>(
    resendConfirmation.bind(null, locale),
    {},
  );

  // ?next=/settings → después de entrar, volvemos a esa página.
  const next = searchParams.get("next") ?? "/";
  const confirmFailed = searchParams.get("confirm_error") === "1";
  const offerResend = confirmFailed || state.error === "email_not_confirmed";

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {confirmFailed && !state.error ? <FormError>{t("errors.confirm_failed")}</FormError> : null}
      {state.error ? <FormError>{t(`errors.${state.error}`)}</FormError> : null}
      <input type="hidden" name="next" value={next} />
      <Field label={t("email")} name="email" type="email" autoComplete="email" required />
      <Field label={t("password")} name="password" type="password" autoComplete="current-password" required />
      <SubmitButton pending={pending}>{t("logInCta")}</SubmitButton>

      {offerResend ? (
        <div className="flex flex-col gap-2 rounded-[10px] border border-line p-3">
          <button
            type="submit"
            formAction={resendAction}
            disabled={resending}
            className="h-11 rounded-[10px] border border-line font-semibold hover:bg-line disabled:opacity-60"
          >
            {t("resendCta")}
          </button>
          <p role="status" className="text-sm text-muted">
            {resendState.resent
              ? t("resendDone")
              : resendState.error
                ? t(`errors.${resendState.error}`)
                : t("resendHint")}
          </p>
        </div>
      ) : null}

      <p className="text-sm text-muted">
        {t("noAccount")}{" "}
        <Link href="/signup" className="font-semibold text-ink underline underline-offset-4">
          {t("signUpCta")}
        </Link>
      </p>
    </form>
  );
}

"use client";
// Formulario de registro. useActionState conecta el <form> con la Server Action
// y nos devuelve su resultado (error o "revisá tu email") y si está enviando.
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { signUp, type AuthState } from "@/app/[locale]/(auth)/actions";
import { Link } from "@/i18n/navigation";
import { Field, FormError, SubmitButton } from "./AuthFields";

export function SignUpForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signUp.bind(null, locale),
    {},
  );

  if (state.checkEmail) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <p className="font-display text-3xl font-black">{t("checkEmailTitle")}</p>
        <p className="text-soft">{t("checkEmailBody")}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error ? <FormError>{t(`errors.${state.error}`)}</FormError> : null}
      <Field
        label={t("username")}
        hint={t("usernameHint")}
        name="username"
        autoComplete="username"
        required
        minLength={3}
        maxLength={20}
      />
      <Field label={t("email")} name="email" type="email" autoComplete="email" required />
      <Field
        label={t("password")}
        hint={t("passwordHint")}
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
      />
      <SubmitButton pending={pending}>{t("signUpCta")}</SubmitButton>
      <p className="text-sm text-muted">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-semibold text-ink underline underline-offset-4">
          {t("logInCta")}
        </Link>
      </p>
    </form>
  );
}

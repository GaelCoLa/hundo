import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { locale } from "next/root-params";
import { AuthCard } from "@/components/auth/AuthCard";
import { LogInForm } from "@/components/auth/LogInForm";

export default async function LogInPage() {
  const t = await getTranslations("auth");
  return (
    <AuthCard title={t("logInTitle")}>
      {/* El formulario lee ?next= de la URL, por eso va dentro de <Suspense>. */}
      <Suspense>
        <LogInForm locale={await locale()} />
      </Suspense>
    </AuthCard>
  );
}

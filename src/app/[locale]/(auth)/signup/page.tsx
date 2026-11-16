import { getTranslations } from "next-intl/server";
import { locale } from "next/root-params";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default async function SignUpPage() {
  const t = await getTranslations("auth");
  return (
    <AuthCard title={t("signUpTitle")}>
      <SignUpForm locale={await locale()} />
    </AuthCard>
  );
}

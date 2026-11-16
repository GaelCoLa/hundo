import { useTranslations } from "next-intl";
import { ComingSoon } from "@/components/ComingSoon";

export default function Page() {
  const t = useTranslations("nav");
  return <ComingSoon section={t("reviews")} />;
}

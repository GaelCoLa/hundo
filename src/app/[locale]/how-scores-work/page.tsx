// Explica en público cómo se calcula la nota de la comunidad. La transparencia
// es parte de la confianza: cualquiera puede ver por qué un troll no mueve la nota.
import { useTranslations } from "next-intl";
import { ScaleBar } from "@/components/ScaleBar";

const RULES = [
  { title: "rule1Title", body: "rule1Body" },
  { title: "rule2Title", body: "rule2Body" },
  { title: "rule3Title", body: "rule3Body" },
] as const;

export default function HowScoresWorkPage() {
  const t = useTranslations("howScores");
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 pb-20 pt-6 sm:px-8 sm:pt-10">
      <header className="flex flex-col gap-5">
        <h1 className="font-display text-6xl font-black uppercase leading-[0.9]">{t("title")}</h1>
        <p className="text-lg leading-relaxed text-soft">{t("intro")}</p>
      </header>
      {/* Las tres reglas se aplican en este orden, por eso van numeradas. */}
      <ol className="flex flex-col gap-4">
        {RULES.map((rule, i) => (
          <li key={rule.title} className="flex gap-5 rounded-[20px] bg-surface p-6">
            <span className="font-display text-5xl font-black leading-none text-accent">{i + 1}</span>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold">{t(rule.title)}</h2>
              <p className="leading-relaxed text-soft">{t(rule.body)}</p>
            </div>
          </li>
        ))}
      </ol>
      <section className="flex flex-col gap-5">
        <h2 className="font-display text-4xl font-black uppercase">{t("scaleTitle")}</h2>
        <ScaleBar />
      </section>
    </main>
  );
}

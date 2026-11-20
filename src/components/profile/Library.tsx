// Biblioteca del perfil: todos los juegos calificados, con orden y filtro.
// El orden y el filtro viajan en la URL (?sort=hours&cat=excellent): son links
// comunes, funcionan sin JavaScript y se pueden compartir.
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Cover } from "@/components/games/Cover";
import { StaggerItem, StaggerList } from "@/components/motion/Stagger";
import { getScaleCategory, SCALE, type ScaleKey } from "@/lib/scale";
import type { LibraryItem, LibrarySort } from "@/lib/profile-stats";
import { LinkPending } from "@/components/LinkPending";

export type LibraryEntry = LibraryItem & { slug: string; coverImageId: string | null };

const SORTS: LibrarySort[] = ["recent", "score", "hours", "finished"];

type Props = { username: string; items: LibraryEntry[]; sort: LibrarySort; cat: ScaleKey | null };

export async function Library({ username, items, sort, cat }: Props) {
  const [t, ts, format] = await Promise.all([getTranslations("profile"), getTranslations("scale"), getFormatter()]);
  const base = `/u/${username}`;
  const href = (s: LibrarySort, c: ScaleKey | null) => `${base}?sort=${s}${c ? `&cat=${c}` : ""}`;
  const pill = (active: boolean) =>
    `relative rounded-full px-3 py-1.5 text-sm font-semibold ${active ? "bg-ink text-bg" : "bg-surface text-soft hover:text-ink"}`;

  return (
    <section aria-labelledby="library" className="flex flex-col gap-5">
      <h2 id="library" className="font-display text-4xl font-black uppercase">
        {t("library")}
      </h2>

      <nav aria-label={t("sortBy")} className="flex flex-wrap gap-2">
        {SORTS.map((s) => (
          <Link key={s} href={href(s, cat)} aria-current={s === sort ? "true" : undefined} className={pill(s === sort)}>
            {t(`sort.${s}`)}
          <LinkPending /></Link>
        ))}
      </nav>
      <nav aria-label={t("filterBy")} className="flex flex-wrap gap-2">
        <Link href={href(sort, null)} aria-current={cat === null ? "true" : undefined} className={pill(cat === null)}>
          {t("allCategories")}
        <LinkPending /></Link>
        {SCALE.map((c) => (
          <Link key={c.key} href={href(sort, c.key)} aria-current={cat === c.key ? "true" : undefined} className={`${pill(cat === c.key)} flex items-center gap-1.5`}>
            <span aria-hidden="true" className="size-2.5 rounded-sm" style={{ background: c.color }} />
            {ts(c.key)}
          <LinkPending /></Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="text-soft">{cat ? t("emptyCategory") : t("empty")}</p>
      ) : (
        <StaggerList className="flex flex-col gap-2">
          {items.map((item) => {
            const category = getScaleCategory(item.score);
            return (
              <StaggerItem key={item.slug}>
                <Link href={`/games/${item.slug}`} className="flex items-center gap-4 rounded-[14px] bg-surface p-3 transition duration-200 hover:translate-x-1 hover:ring-2 hover:ring-line">
                  <Cover imageId={item.coverImageId} name={item.name} size="t_cover_small" className="w-12 shrink-0" />
                  <span className="flex grow flex-col">
                    <span className="font-semibold leading-tight">{item.name}</span>
                    <span className="text-sm text-muted">
                      {[
                        item.hoursPlayed !== null ? `${item.hoursPlayed} h` : null,
                        item.finishedOn ? format.dateTime(new Date(`${item.finishedOn}T12:00:00Z`), { day: "numeric", month: "short", year: "numeric" }) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="font-display text-4xl font-black leading-none" style={{ color: category.color }}>
                      {item.score}
                    </span>
                    <span className="text-xs text-muted">{ts(category.key)}</span>
                  </span>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerList>
      )}
    </section>
  );
}

// Convierte la respuesta cruda de IGDB a nuestro formato. IGDB omite los
// campos que no tiene (juegos viejos sin portada, sin fecha, etc.), así que
// todo lo opcional cae a null o a una lista vacía en vez de romper la página.

export type IgdbGame = {
  id: number;
  slug: string;
  name: string;
  coverImageId: string | null;
  releaseYear: number | null;
  genres: string[];
  developers: string[];
  summary: string | null;
};

type Raw = Record<string, unknown>;

const isRecord = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v : null);

export function mapIgdbGame(raw: unknown): IgdbGame | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "number" ? raw.id : null;
  const slug = str(raw.slug);
  const name = str(raw.name);
  if (id === null || slug === null || name === null) return null;

  const cover = isRecord(raw.cover) ? str(raw.cover.image_id) : null;
  // first_release_date viene en segundos desde 1970 (formato Unix).
  const releaseYear =
    typeof raw.first_release_date === "number"
      ? new Date(raw.first_release_date * 1000).getUTCFullYear()
      : null;

  const genres = Array.isArray(raw.genres)
    ? raw.genres.map((g) => (isRecord(g) ? str(g.name) : null)).filter((g): g is string => g !== null)
    : [];

  const developers = Array.isArray(raw.involved_companies)
    ? raw.involved_companies
        .filter((c) => isRecord(c) && c.developer === true && isRecord(c.company))
        .map((c) => str(((c as Raw).company as Raw).name))
        .filter((n): n is string => n !== null)
    : [];

  return { id, slug, name, coverImageId: cover, releaseYear, genres, developers, summary: str(raw.summary) };
}

export function coverUrl(imageId: string | null, size: "t_cover_big" | "t_cover_small"): string | null {
  return imageId ? `https://images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg` : null;
}

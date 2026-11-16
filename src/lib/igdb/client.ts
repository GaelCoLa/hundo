// Cliente de IGDB. Solo corre en el SERVIDOR: el secreto de Twitch nunca llega
// al navegador (por eso IGDB ni siquiera acepta llamadas desde un navegador).
//
// Dos niveles de caché:
//  - El token de acceso de Twitch dura ~60 días: lo guardamos en memoria y lo
//    renovamos un minuto antes de que venza.
//  - Los resultados de búsqueda se guardan con "use cache" durante días: la
//    misma búsqueda no vuelve a pedirle nada a IGDB (que permite ~4 pedidos/seg).
import "server-only";
import { cacheLife } from "next/cache";
import { mapIgdbGame, type IgdbGame } from "./map";
import { buildSearchQuery, buildSlugQuery } from "./query";

const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const API_URL = "https://api.igdb.com/v4";

let token: { value: string; expiresAt: number } | null = null;

function credentials() {
  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("IGDB_CLIENT_ID / IGDB_CLIENT_SECRET are not set");
  return { clientId, clientSecret };
}

async function getToken(): Promise<string> {
  if (token && Date.now() < token.expiresAt - 60_000) return token.value;
  const { clientId, clientSecret } = credentials();
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });
  const res = await fetch(`${TOKEN_URL}?${params}`, { method: "POST", cache: "no-store" });
  if (!res.ok) throw new Error(`Twitch token request failed: ${res.status}`);
  const body = (await res.json()) as { access_token: string; expires_in: number };
  token = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return token.value;
}

/** Hace una consulta a un endpoint de IGDB. Lanza un error si IGDB falla. */
export async function igdbRequest(endpoint: string, query: string): Promise<unknown[]> {
  const { clientId } = credentials();
  const res = await fetch(`${API_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${await getToken()}`,
      Accept: "application/json",
    },
    body: query,
    cache: "no-store",
  });
  if (res.status === 401) token = null; // token revocado: se pide otro la próxima vez
  if (!res.ok) throw new Error(`IGDB ${endpoint} failed: ${res.status}`);
  return (await res.json()) as unknown[];
}

// Los errores se lanzan DENTRO de la función cacheada (y así no se guardan en
// caché); la función pública los atrapa y devuelve un resultado vacío.
async function cachedSearch(query: string): Promise<IgdbGame[]> {
  "use cache";
  cacheLife("days");
  const raw = await igdbRequest("games", query);
  return raw.map(mapIgdbGame).filter((g): g is IgdbGame => g !== null);
}

export async function searchGames(term: string): Promise<IgdbGame[]> {
  const query = buildSearchQuery(term);
  if (!query) return [];
  try {
    return await cachedSearch(query);
  } catch (error) {
    console.error("IGDB search failed", error);
    return [];
  }
}

/** Busca un juego por slug. Lanza un error si IGDB falla (quien llama decide qué hacer). */
export async function getGameBySlug(slug: string): Promise<IgdbGame | null> {
  const query = buildSlugQuery(slug);
  if (!query) return null;
  const raw = await igdbRequest("games", query);
  return raw.length > 0 ? mapIgdbGame(raw[0]) : null;
}

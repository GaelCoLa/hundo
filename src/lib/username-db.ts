// ¿Ya existe este nombre de usuario?
// Usamos igualdad exacta (eq) y no ILIKE: en ILIKE el "_" es un comodín, y
// "gael_c" coincidiría con "gaelxc". Los usuarios ya se guardan en minúsculas
// (lo garantizan la validación y el CHECK de la base), así que eq alcanza.

type Query = {
  select(columns: string): Query;
  eq(column: string, value: string): Query;
  maybeSingle(): PromiseLike<{ data: unknown }>;
};
type ClientLike = { from(table: string): unknown };

export async function isUsernameTaken(client: ClientLike, normalizedUsername: string): Promise<boolean> {
  const query = client.from("profiles") as Query;
  const { data } = await query.select("id").eq("username", normalizedUsername).maybeSingle();
  return data != null;
}

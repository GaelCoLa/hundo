// Probamos la consulta con un cliente de Supabase simulado: registramos qué
// filtros se usan, sin tocar la base de datos real.
import { describe, expect, test } from "vitest";
import { isUsernameTaken } from "@/lib/username-db";

function fakeClient(existing: string[]) {
  const calls: string[] = [];
  const builder = {
    filter: (): boolean => true,
    select() {
      return this;
    },
    eq(col: string, value: string) {
      calls.push(`eq:${col}=${value}`);
      this.filter = () => existing.includes(value);
      return this;
    },
    ilike(col: string, value: string) {
      calls.push(`ilike:${col}=${value}`);
      // Semántica real de ILIKE: "_" es comodín de un carácter.
      const re = new RegExp(`^${value.replace(/_/g, ".")}$`, "i");
      this.filter = () => existing.some((u) => re.test(u));
      return this;
    },
    async maybeSingle() {
      return { data: this.filter() ? { id: "x" } : null, error: null };
    },
  };
  return { client: { from: () => builder }, calls };
}

describe("isUsernameTaken", () => {
  test("detecta un usuario existente", async () => {
    const { client } = fakeClient(["gael_c"]);
    expect(await isUsernameTaken(client, "gael_c")).toBe(true);
  });

  test("el guion bajo no funciona como comodín", async () => {
    const { client } = fakeClient(["gaelxc"]);
    expect(await isUsernameTaken(client, "gael_c")).toBe(false);
  });

  test("compara por igualdad exacta (los usuarios se guardan en minúsculas)", async () => {
    const { client, calls } = fakeClient([]);
    await isUsernameTaken(client, "gael_c");
    expect(calls).toEqual(["eq:username=gael_c"]);
  });
});

// Si una clave existe en inglés y no en español (o al revés), la página mostraría
// el nombre de la clave en crudo. Esta prueba lo detecta antes de publicar.
import { expect, test } from "vitest";
import en from "../../messages/en.json";
import es from "../../messages/es.json";

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[path] = value;
    else Object.assign(out, flatten(value, path));
  }
  return out;
}

const flatEn = flatten(en as Tree);
const flatEs = flatten(es as Tree);

test("inglés y español tienen exactamente las mismas claves", () => {
  expect(Object.keys(flatEs).sort()).toEqual(Object.keys(flatEn).sort());
});

test("ningún texto está vacío", () => {
  for (const [key, value] of Object.entries({ ...flatEn, ...flatEs })) {
    expect(value.trim(), key).not.toBe("");
  }
});

test("hay un nombre traducido para cada categoría de la escala", () => {
  for (const key of ["mediocre", "fair", "decent", "good", "great", "excellent", "masterpiece"]) {
    expect(flatEn[`scale.${key}`]).toBeTruthy();
    expect(flatEs[`scale.${key}`]).toBeTruthy();
  }
});

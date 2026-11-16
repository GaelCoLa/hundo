// Valida el parámetro ?next= (a dónde volver después de entrar o confirmar).
// Sin esto, un atacante podría armar un enlace legítimo de Hundo que termine
// llevando a su propio sitio ("redirección abierta"), ideal para phishing.
// Los navegadores tratan "\" como "/" e ignoran tabulaciones y saltos de línea,
// así que no alcanza con mirar si empieza con "/": resolvemos la URL completa
// y exigimos que siga apuntando a nuestro propio sitio.

const BASE = "http://hundo.internal";

export function safeNextPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) return "/";
  if (/[\\\s]/.test(value)) return "/";
  try {
    const url = new URL(value, BASE);
    if (url.origin !== BASE) return "/";
    return url.pathname + url.search;
  } catch {
    return "/";
  }
}

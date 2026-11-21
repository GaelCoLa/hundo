// Listas que aparecen en cascada: cada elemento sube y aparece un instante
// después del anterior.
//
// Antes se hacía con Motion (JavaScript, "cuando la lista entra en pantalla").
// Eso fallaba: si la lista cambiaba (por ejemplo, al filtrar la biblioteca) o la
// pestaña estaba en segundo plano, algunos elementos se quedaban invisibles
// (opacidad 0) hasta recargar. Ahora es una animación CSS (clase "stagger" en
// globals.css): cada elemento se anima solo al aparecer y SIEMPRE termina
// visible, pase lo que pase con la lista o con la pestaña.
import type { ReactNode } from "react";

export function StaggerList({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <ul className={`stagger ${className}`}>{children}</ul>;
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return <li className={className}>{children}</li>;
}

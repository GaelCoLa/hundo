// Versiones de Link, redirect, etc. que agregan solas el idioma actual a la URL.
// Usá siempre estas en lugar de las de "next/link" o "next/navigation".
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

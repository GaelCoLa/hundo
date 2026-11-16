# Hundo

Every game you beat deserves a score. Hundo is a community site where players rate the games they finish from 1 to 100, with a review, hours played and finish date. The community score is computed so that no account weighs more than another and review bombing has little effect.

## Stack (y por qué)

| Pieza | Qué hace | Por qué |
|---|---|---|
| **Next.js** (App Router) + **React** + **TypeScript** | Páginas y "mini servidor" (route handlers, server actions) | El entorno de frontend más pedido hoy; el servidor propio guarda las claves de IGDB |
| **Tailwind CSS** | Estilos | Diseño consistente con tokens (colores, tipografías) definidos en un solo lugar |
| **next-intl** | Inglés y español | Rutas `/en` y `/es`, textos en archivos JSON |
| **Supabase** | Base de datos Postgres, usuarios, archivos | SQL real con seguridad por filas (RLS); plan gratuito generoso |
| **Vercel** | Hosting | Publica solo cada vez que se sube un cambio a GitHub |
| **Vitest** | Pruebas | Rápido y compatible con TypeScript sin configuración extra |
| **IGDB** (Twitch) | Datos y portadas de juegos | Mucho más completo y preciso que RAWG |

## Cómo correrlo en tu PC

```bash
npm install
cp .env.example .env.local   # y completar los valores
npm run dev                  # abre http://localhost:3000
npm test                     # corre las pruebas
```

## Documentación

- Diseño: [`docs/2026-11-16-hundo-design.md`](docs/2026-11-16-hundo-design.md)
- Maqueta aprobada: [`docs/mockups/mix-approved.html`](docs/mockups/mix-approved.html)
- Planes de construcción: [`docs/superpowers/plans/`](docs/superpowers/plans/)

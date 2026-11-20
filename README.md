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

## Base de datos

Los cambios de la base viven como archivos SQL en `supabase/migrations/` (una "migración" por cambio, en orden). Para aplicarlos (en PowerShell usá `npx.cmd`):

```bash
npx supabase db push --remote                          # hundo-dev (proyecto enlazado)
npx supabase db push --remote=emrebckwpeuzcneeqkkn     # hundo-prod
```

### Pruebas de la base de datos

Corren dentro de una transacción que se deshace al final (no dejan datos). Contra hundo-dev:

```bash
npx supabase db query --remote --yes --file supabase/tests/score.sql        # nota de la comunidad
npx supabase db query --remote --yes --file supabase/tests/ratings_rls.sql  # seguridad de calificaciones
```

Cada una termina mostrando `... tests passed`; si algo falla, Postgres corta con el mensaje de la verificación.

## Deploy

- El código vive en GitHub; **Vercel** publica solo cada vez que se sube un cambio a la rama `main`.
- Variables en Vercel (Settings → Environment Variables), todas de **hundo-prod**:
  - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (públicas).
  - `SUPABASE_SECRET_KEY` (secreta: Supabase → Project Settings → API Keys → Secret keys). La usa el servidor para guardar los datos de los juegos de IGDB.
  - `IGDB_CLIENT_ID` y `IGDB_CLIENT_SECRET` (dev.twitch.tv → Applications → Hundo → Manage). La misma app de Twitch sirve para desarrollo y producción.
- Las variables secretas nunca llevan `NEXT_PUBLIC_`: ese prefijo las manda al navegador.
- **Mantener despierta la base:** en el plan gratis, Supabase pausa un proyecto tras 7 días sin actividad. `vercel.json` programa una visita diaria (12:00 UTC) a `/api/health`, que hace una consulta mínima (`ping`) y responde `{"ok":true}`. Se ve en Vercel → Settings → Cron Jobs.
- **Recalcular notas:** `pg_cron` (dentro de Supabase) corre `refresh_all_game_stats()` todos los días a las 03:15 UTC, para que las cuentas que cumplen 3 días empiecen a contar. Se ve con `select * from cron.job`.
- En Supabase hundo-prod → Authentication → URL Configuration: *Site URL* = la URL de Vercel y en *Redirect URLs* `<url de Vercel>/**`.
- Emails de confirmación: SMTP propio (Brevo) en Authentication → Emails → SMTP Settings. El SMTP incluido en Supabase solo envía a miembros del equipo.
  - Servidor `smtp-relay.brevo.com`, puerto `587`, usuario = el *Login* de Brevo (Settings → SMTP y API).
  - ⚠️ **La clave SMTP `hundo-supabase` vence el 16/11/2027.** Antes de esa fecha: generar una nueva en Brevo y pegarla en Supabase hundo-prod → SMTP Settings → Password. Si vence, nadie nuevo puede registrarse (los emails dejan de salir sin mostrar error).
  - No activar "IP autorizadas" en Brevo: Supabase envía desde IPs que cambian.

## Documentación

- Diseño: [`docs/2026-11-16-hundo-design.md`](docs/2026-11-16-hundo-design.md)
- Maqueta aprobada: [`docs/mockups/mix-approved.html`](docs/mockups/mix-approved.html)
- Planes de construcción: [`docs/superpowers/plans/`](docs/superpowers/plans/)

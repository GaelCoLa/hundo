# Hundo — Documento de diseño

Fecha: 16/11/2026 · Estado: borrador para aprobación

## 1. Qué es y por qué

**Hundo** es una página web pública donde cualquier gamer crea su perfil y califica los videojuegos que jugó del **1 al 100**, con reseña, horas jugadas y fecha de finalización. La nota de cada juego la pone **la comunidad**: nadie tiene más peso que otro, ni siquiera un crítico profesional. La relevancia de una reseña se gana solo con los "útil" que le dan los demás.

Nace de una planilla Excel personal (escala de 7 categorías, 13 juegos con reseñas) y de un intento anterior (GameScore) que funcionaba pero se veía genérico y usaba RAWG, una API con datos de mala calidad.

Objetivo secundario explícito: el dueño (Gael) quiere **aprender** con el proyecto tecnologías que se usan en el trabajo real. Por eso las decisiones técnicas se explican, y el código tiene que ser legible y convencional.

## 2. Metas, no-metas y anti-metas

**Metas**
- Calificar un juego del 1 al 100 viendo en vivo su categoría y color.
- Reseña opcional, horas jugadas y fecha de finalización por calificación.
- Perfiles públicos con estadísticas (el equivalente de la hoja "Resumen" del Excel).
- Nota de comunidad **resistente al review bombing**.
- Diseño visual con identidad propia y de calidad, que un gamer quiera usar.
- 100% gratis de operar mientras el proyecto crece.
- Inglés por defecto, español disponible desde el día uno.

**No-metas (v1)**
- Plataforma y estado del juego (jugando, abandonado, etc.): descartados por Gael.
- Listas personalizadas, notificaciones, app móvil, dominio propio.
- Detección automática de ataques de votos (queda como mejora futura, la "opción C").
- Monetización.

**Anti-metas (sería un fracaso aunque funcione)**
- Que se vea como una plantilla genérica de panel de control (el problema de GameScore).
- Que la nota de un juego se pueda mover con un puñado de cuentas troll.
- Que una cuenta tenga más peso que otra por su título o profesión.
- Datos de juegos incompletos o duplicados (el problema de RAWG).

## 3. Restricciones

- **Costo cero.** Los planes gratuitos tienen límites:
  - **Supabase Free:** 500 MB de base de datos, 1 GB de archivos, 50.000 usuarios activos/mes, y **pausa el proyecto tras 7 días sin actividad**.
  - **Vercel Hobby:** solo uso no comercial, y tareas programadas (cron) como máximo una vez por día.
  - **IGDB:** gratis para uso no comercial, unas 4 consultas por segundo, **no admite llamadas desde el navegador** (necesita servidor intermedio que guarde las claves).
- Si en el futuro hay monetización, hay que revisar Vercel (plan pago u otro hosting) e IGDB (acuerdo comercial con Twitch).

## 4. Enfoques considerados

| Enfoque | A favor | En contra | Decisión |
|---|---|---|---|
| **Next.js + Supabase + Vercel** | Stack muy demandado en el mercado laboral; Next.js trae servidor propio para IGDB; Postgres real (SQL); auth y archivos incluidos | Pausa de Supabase por inactividad; Vercel Hobby no comercial | **Elegido** |
| SvelteKit + Supabase + Cloudflare | Hosting gratuito más generoso y comercial | Svelte es poco pedido en empleos; el aprendizaje es una meta | Descartado |
| Firebase | Muy fácil de arrancar | Base NoSQL: media recortada, rankings y "votos válidos" serían engorrosos y caros | Descartado |

API de juegos: **IGDB** (de Twitch) en lugar de RAWG, por su calidad de datos y portadas.

## 5. Decisiones de producto (tomadas con Gael)

### 5.1 Escala (sin cambios respecto al Excel)

| Rango | Español | Inglés | Color |
|---|---|---|---|
| 1–39 | Mediocre | Mediocre | `#E5484D` |
| 40–59 | Regular | Fair | `#F2884B` |
| 60–74 | Aceptable | Decent | `#F5C451` |
| 75–84 | Bueno | Good | `#9BD35A` |
| 85–89 | Muy bueno | Great | `#46C27A` |
| 90–94 | Excelente | Excellent | `#3AA8E0` |
| 95–100 | Obra maestra | Masterpiece | `#B57CFF` |

La nota sobre 10 se muestra derivada (`score / 10`, un decimal).

### 5.2 Nota de comunidad anti review-bombing ("opción B")

1. **Voto válido**: cuenta para la nota del juego solo si el autor tiene **email verificado**, la cuenta tiene **al menos 3 días** de antigüedad y no está suspendida. Todas las notas se ven igual en el perfil del usuario; la validez solo afecta la nota del juego.
2. **Media recortada**: con `n` votos válidos ordenados, se descartan `floor(n × 0.10)` notas de cada extremo y se promedia el resto; se redondea a entero.
3. **Mínimo**: con menos de **5 votos válidos** no se muestra nota ("Not enough ratings yet") y el juego no entra en rankings.
4. Página pública **"How scores work"** que explica las tres reglas.
5. *(Decisión del constructor)* La distribución "How players rated it", las horas promedio y el puesto en el género usan **solo votos válidos**, igual que la nota, para que todos los números públicos del juego sean coherentes y resistentes a trolls. Los contadores de calificaciones y reseñas cuentan todo lo que no está oculto.
6. *(Decisión del constructor)* Si un moderador **oculta una reseña**, se oculta el texto pero la nota sigue contando; la media recortada ya neutraliza notas extremas. Si un usuario es **suspendido**, sus notas dejan de contar.

### 5.3 Reseñas y reputación
- Una calificación por usuario y juego (se puede editar).
- Botón "Helpful" (útil), uno por usuario por reseña, no se puede votar la propia.
- Orden por defecto: más útiles; alternativa: más recientes.
- Insignia **"Top reviewer"**: usuario con 50 o más "útil" recibidos en total.
- Los críticos profesionales son bienvenidos y no tienen ninguna distinción especial.
- Aviso de spoilers opcional: la reseña aparece tapada hasta que el lector hace clic.

### 5.4 Funciones de v1
- **Inicio**: titular, juegos destacados (*decisión del constructor*: calculados automáticamente, los más calificados en los últimos 30 días; sin selección manual), actividad reciente de la comunidad.
- **Buscar juegos** (IGDB, con caché propio).
- **Ficha de juego**: portada, datos, nota de comunidad en anillo, distribución "How players rated it", horas promedio, cantidad de reseñas, puesto en su género, reseñas.
- **Calificar**: control deslizante 1–100, reseña, spoilers, horas, fecha de finalización.
- **Perfil público** `/u/<usuario>`: avatar, bio, Top 5 favoritos, estadísticas (promedio, horas totales, juegos por categoría), biblioteca con filtros y orden.
- **Seguir** usuarios y **feed** con su actividad.
- **Explorar**: mejor puntuados (global y por género), más reseñados, reseñas recientes.
- **Importar** desde Excel/CSV: se empareja cada fila con un juego de IGDB y el usuario confirma antes de guardar. El usuario elige qué columna es cada dato (nombre, nota, reseña, horas, fecha), con detección automática de encabezados conocidos. Formato de referencia, la planilla de Gael (hoja "Mi biblioteca"): `Videojuego | Puntuación (/100) | Puntuación (/10) | Fecha de finalización | Horas jugadas | Nota personal / reseña | Género | Año`. Las fechas vienen como número de serie de Excel, las horas pueden traer texto ("16 (APROX)": se toma el número) y los nombres son informales ("Resident Evil 8 (Village)"), así que el emparejamiento muestra los 3 mejores candidatos de IGDB para que el usuario elija.
- **Reportar** reseñas, y un panel de moderación para administradores (ocultar reseña, suspender usuario). *(Decisión del constructor)* Un usuario suspendido puede iniciar sesión y leer, pero no calificar, reseñar, votar ni seguir; su perfil y sus reseñas dejan de ser públicos.
- **Configuración**: editar perfil, cambiar idioma, borrar la cuenta y sus datos.
- **Login**: email + contraseña con verificación, Google y Discord.

## 6. Diseño visual (aprobado)

Referencia: maqueta "Mix · Marquee + Console" en el lienzo de Hundo (https://claude.ai/artifact/WXcrw9tTcKibKtv1VQWwug). Copia local del código de la maqueta: [`docs/mockups/mix-approved.html`](mockups/mix-approved.html). La maqueta muestra la portada; las demás pantallas siguen el mismo lenguaje (titulares condensados, tarjetas `#182038` con radio de 20 px, números de nota grandes en el color de su categoría).

- **Base**: fondo `#0F1424`, superficies `#182038`, bordes `#2C3654`, texto `#EEF1F8`, texto secundario `#9AA3BD`/`#B9C0D4`.
- **Acento de marca**: amarillo `#FFC94A` (logo, botones principales, "Top reviewer").
- **Tipografías**: *Big Shoulders Display* (titulares y números de nota), *Figtree* (texto), *Unbounded* solo para el logotipo.
- **Logo**: cuadrado amarillo redondeado con "100" + "hundo".
- **Tarjeta de juego**: fondo teñido con el color dominante de la portada, anillo de nota, distribución por categoría y tres datos.
- Los colores de la escala se usan siempre igual, en toda la página.
- Responsive hasta celular, foco visible con teclado, contraste AA.

## 7. Arquitectura técnica

```
Navegador ──► Vercel (Next.js)
                ├─ Páginas (React Server Components)
                ├─ Route handlers /api/igdb/* ──► IGDB (claves secretas)
                └─ Supabase client ──► Supabase
                                         ├─ Postgres (datos + reglas RLS)
                                         ├─ Auth (email, Google, Discord)
                                         └─ Storage (avatares)
Cron diario de Vercel ──► recálculo de notas en Postgres (mantiene Supabase activo)
```

- **Next.js (App Router) + TypeScript**: páginas y servidor intermedio.
- **Tailwind CSS**: estilos, con los tokens del punto 6.
- **next-intl**: inglés y español, rutas `/en/...` y `/es/...`.
- **Supabase**: Postgres con **Row Level Security** (cada usuario solo modifica lo suyo; la seguridad vive en la base de datos, no solo en el código).
- **Caché de juegos**: la primera vez que se ve un juego se guarda en la tabla `games`; después se lee de ahí. Se re-sincroniza con IGDB si los datos tienen más de 30 días.
- **Recálculo de notas**: una función de Postgres recalcula las estadísticas de un juego cada vez que se crea, edita o borra una calificación. El cron diario recalcula todo (porque una cuenta que cumple 3 días empieza a contar sin que cambie ninguna calificación) y, de paso, evita la pausa de Supabase.
- **Límites anti-spam**: como máximo 60 calificaciones por hora por usuario, reseñas de hasta 5.000 caracteres, nombres de usuario de 3 a 20 caracteres `[a-z0-9_]`.

## 8. Modelo de datos (Postgres)

```
profiles        id (= auth.users.id) PK, username UNIQUE, display_name, avatar_url,
                bio, locale, is_admin, is_suspended, created_at
games           id (= id de IGDB) PK, slug UNIQUE, name, cover_image_id, release_year,
                genres text[], developers text[], summary, igdb_synced_at,
                community_score smallint NULL, valid_ratings_count, ratings_count,
                reviews_count, avg_hours, score_distribution int[7], updated_at
ratings         id PK, user_id → profiles, game_id → games, score 1..100,
                review text NULL, has_spoilers, hours_played numeric(6,1) NULL,
                finished_on date NULL, is_hidden, created_at, updated_at,
                UNIQUE (user_id, game_id)
review_likes    (user_id, rating_id) PK, created_at   — no se puede votar la propia
follows         (follower_id, followee_id) PK, created_at — no se puede seguir a uno mismo
favorites       (user_id, position 1..5) PK, game_id
reports         id PK, reporter_id, rating_id, reason, status (open/resolved), created_at
```

Índices: `ratings(game_id)`, `ratings(user_id, created_at)`, `games(community_score) WHERE valid_ratings_count >= 5`, `games USING gin(genres)`.

## 9. Lo que Gael tiene que hacer (cuentas gratuitas)

1. Cuenta de **GitHub** (para guardar el código).
2. Cuenta de **Supabase** y crear un proyecto.
3. Cuenta de **Vercel** conectada a GitHub.
4. Cuenta de **Twitch** con verificación en dos pasos y registrar una app en dev.twitch.tv (para las claves de IGDB).
5. (Opcional) Credenciales de Google y Discord para el login social.

Cada paso se le explica en su momento, con instrucciones concretas. Las claves se cargan como variables de entorno y nunca quedan en el código.

## 10. Calidad y pruebas
- Pruebas unitarias (Vitest) del cálculo de nota: media recortada, mínimo de votos, validez.
- Pruebas de las reglas de seguridad (RLS) contra una base local de Supabase.
- Prueba de punta a punta (Playwright) del flujo registrarse → buscar → calificar → ver en el perfil.
- Importación inicial de los 13 juegos del Excel de Gael como prueba real.

## 11. Orden de construcción (*decisión del constructor*, Gael puede cambiarlo)

1. **Base publicada**: proyecto, diseño base, inglés/español, login con email, publicado en Vercel.
2. **Núcleo**: búsqueda con IGDB, ficha de juego, calificar, perfil con estadísticas, nota de comunidad.
3. **Comunidad**: "útil", Top reviewer, seguir, feed, explorar y rankings.
4. **Extras**: importar Excel/CSV, reportes y moderación, login con Google y Discord.

Cada fase termina publicada online, así la página funciona desde la fase 1.

**Modo de trabajo (decidido por Gael):** Claude escribe el código y lo explica a medida que avanza. Cada fase cierra con un resumen de qué se hizo, qué tecnología se usó y por qué; el código lleva comentarios en los puntos que enseñan algo (RLS, cálculo de la nota, servidor intermedio de IGDB).

## 12. Decisiones que quedan para quien construye
- Estructura de carpetas, componentes y nombres internos.
- Librería de gráficos (o SVG propio) para distribuciones y estadísticas.
- Paginación (cursor vs. offset) y cantidades por página.
- Color dominante de cada portada: calcularlo al cachear el juego o usar un color por género.

-- =============================================================================
-- Fase 4 — Perfil editable: Top 5 favoritos y avatares (spec §5.4 y §8).
-- (display_name y bio ya existen en profiles, con sus límites de 40 y 300.)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- favorites: el Top 5 de cada jugador. La clave (user_id, position) permite una
-- sola entrada por puesto; unique (user_id, game_id), un juego una sola vez.
-- La clave foránea compuesta hacia ratings exige que el juego esté calificado
-- por ese usuario, y "on delete cascade" lo saca del Top 5 si borra la nota.
-- -----------------------------------------------------------------------------
create table public.favorites (
  user_id  uuid not null references public.profiles (id) on delete cascade,
  position smallint not null check (position between 1 and 5),
  game_id  bigint not null references public.games (id) on delete cascade,
  primary key (user_id, position),
  unique (user_id, game_id),
  foreign key (user_id, game_id) references public.ratings (user_id, game_id) on delete cascade
);

alter table public.favorites enable row level security;

-- Públicos, salvo los de un perfil suspendido (que solo ve su dueño).
create policy "favorites are public" on public.favorites for select
  using (
    exists (select 1 from public.profiles p
            where p.id = user_id and (p.is_suspended = false or p.id = (select auth.uid())))
  );

-- Solo los propios, y solo juegos que calificó (la regla RLS da un error de
-- permisos claro; la clave foránea es el respaldo).
create policy "users add their own favorites" on public.favorites for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.ratings r where r.user_id = (select auth.uid()) and r.game_id = favorites.game_id)
  );

create policy "users remove their own favorites" on public.favorites for delete to authenticated
  using (user_id = (select auth.uid()));

-- Cambiar el Top 5 = borrar los anteriores e insertar los nuevos (no se editan).
revoke all on public.favorites from anon, authenticated;
grant select on public.favorites to anon, authenticated;
grant insert, delete on public.favorites to authenticated;

-- -----------------------------------------------------------------------------
-- Avatares en Supabase Storage. Bucket público (cualquiera ve las fotos), con
-- límite de 2 MB y solo PNG, JPEG o WebP: aunque alguien se saltee la página,
-- Storage rechaza otros archivos. Cada usuario escribe solo en su carpeta
-- "<su id>/": storage.foldername(name) devuelve las carpetas de la ruta.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp']);

create policy "users upload to their own avatar folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "users update their own avatar files" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "users delete their own avatar files" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Listar la propia carpeta (para borrar el avatar anterior). Las fotos se
-- descargan por la URL pública del bucket, que no pasa por esta regla.
create policy "users list their own avatar folder" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

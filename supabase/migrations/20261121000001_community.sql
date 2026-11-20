-- =============================================================================
-- Fase 3 — Comunidad: "útil" en reseñas, seguir jugadores y contadores de
-- reputación (spec §5.3 y §8).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Contadores. Los mantiene la base (trigger de abajo); la página solo los lee.
-- Nadie los puede escribir desde afuera: profiles y ratings solo dan permiso de
-- UPDATE sobre columnas listadas una por una, y estas no están en la lista.
-- -----------------------------------------------------------------------------
alter table public.ratings add column helpful_count int not null default 0;
alter table public.profiles add column helpful_received int not null default 0;

-- -----------------------------------------------------------------------------
-- review_likes: un "útil" por usuario y reseña (la clave primaria lo garantiza).
-- -----------------------------------------------------------------------------
create table public.review_likes (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  rating_id  uuid not null references public.ratings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, rating_id)
);
create index review_likes_rating_idx on public.review_likes (rating_id);

-- -----------------------------------------------------------------------------
-- follows: quién sigue a quién. No se puede seguir a uno mismo.
-- -----------------------------------------------------------------------------
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index follows_followee_idx on public.follows (followee_id);

-- Ordenar reseñas de un juego por "más útiles" y listar reseñas recientes del sitio.
create index ratings_game_helpful_idx on public.ratings (game_id, helpful_count desc, updated_at desc);
create index ratings_recent_reviews_idx on public.ratings (updated_at desc) where review is not null and is_hidden = false;

-- -----------------------------------------------------------------------------
-- Trigger: cada "útil" que se agrega o se quita suma o resta 1 en la reseña
-- (helpful_count) y en su autor (helpful_received, para la insignia Top reviewer).
-- security definer: corre con permisos del dueño, porque el usuario que vota
-- no tiene permiso de escribir esos contadores.
-- -----------------------------------------------------------------------------
create function public.review_likes_after_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rating_id uuid := coalesce(new.rating_id, old.rating_id);
  v_delta     int  := case when tg_op = 'INSERT' then 1 else -1 end;
begin
  update public.ratings set helpful_count = helpful_count + v_delta where id = v_rating_id;
  update public.profiles p set helpful_received = p.helpful_received + v_delta
  from public.ratings r
  where r.id = v_rating_id and p.id = r.user_id;
  return null;
end;
$$;

-- Si se borra una reseña, sus likes se borran en cascada. Pero la cascada corre
-- DESPUÉS de borrar la reseña: el trigger de cada like ya no la encuentra y no
-- puede saber a qué autor descontarle. Por eso, ANTES de borrar la reseña, se le
-- descuentan al autor todos sus likes de una vez. (Los triggers de los likes
-- borrados en cascada no encuentran la reseña y no descuentan de nuevo.)
create function public.ratings_before_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.helpful_count <> 0 then
    update public.profiles set helpful_received = helpful_received - old.helpful_count
    where id = old.user_id;
  end if;
  return old;
end;
$$;

create trigger review_likes_after_write
  after insert or delete on public.review_likes
  for each row execute function public.review_likes_after_write();

create trigger ratings_before_delete
  before delete on public.ratings
  for each row execute function public.ratings_before_delete();

revoke execute on function public.review_likes_after_write() from public, anon, authenticated;
revoke execute on function public.ratings_before_delete() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.review_likes enable row level security;
alter table public.follows enable row level security;

create policy "likes are public" on public.review_likes for select using (true);

-- Votar "útil": a tu nombre, sin estar suspendido, y solo sobre una reseña
-- ajena, con texto y visible. La subconsulta a ratings respeta su propia RLS:
-- las reseñas ocultas o de suspendidos ni siquiera se encuentran.
create policy "users like others' reviews" on public.review_likes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_suspended = false)
    and exists (
      select 1 from public.ratings r
      where r.id = rating_id
        and r.user_id <> (select auth.uid())
        and nullif(trim(r.review), '') is not null
        and r.is_hidden = false
    )
  );

create policy "users remove their own likes" on public.review_likes for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "follows are public" on public.follows for select using (true);

create policy "users follow as themselves" on public.follows for insert to authenticated
  with check (
    follower_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_suspended = false)
  );

create policy "users unfollow as themselves" on public.follows for delete to authenticated
  using (follower_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Permisos de tabla (además de RLS). Leer: todos. Escribir: solo insertar y
-- borrar (un "útil" o un seguimiento no se edita: se pone o se saca).
-- -----------------------------------------------------------------------------
revoke all on public.review_likes, public.follows from anon, authenticated;
grant select on public.review_likes, public.follows to anon, authenticated;
grant insert, delete on public.review_likes, public.follows to authenticated;

-- Endurecer (pendiente de la Fase 2): Supabase da por defecto TRUNCATE, TRIGGER
-- y REFERENCES; TRUNCATE ignora RLS. La API no los expone, pero no hacen falta.
revoke truncate, trigger, references on public.games, public.ratings from anon, authenticated;

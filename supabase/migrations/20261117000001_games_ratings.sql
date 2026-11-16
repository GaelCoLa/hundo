-- =============================================================================
-- Fase 2: juegos, calificaciones y nota de la comunidad.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- games: copia local de los datos de IGDB + estadísticas ya calculadas.
-- La página solo LEE estas columnas; el cálculo lo hace refresh_game_stats().
-- -----------------------------------------------------------------------------
create table public.games (
  id                  bigint primary key,            -- el mismo id que en IGDB
  slug                text not null unique,
  name                text not null,
  cover_image_id      text,
  release_year        smallint,
  genres              text[] not null default '{}',
  developers          text[] not null default '{}',
  summary             text,
  igdb_synced_at      timestamptz not null,
  community_score     smallint,                      -- NULL hasta tener 5 votos válidos
  valid_ratings_count int not null default 0,
  ratings_count       int not null default 0,
  reviews_count       int not null default 0,
  avg_hours           numeric(6,1),
  score_distribution  int[] not null default '{0,0,0,0,0,0,0}',
  updated_at          timestamptz not null default now()
);

create index games_community_score_idx on public.games (community_score desc)
  where community_score is not null;

alter table public.games enable row level security;

-- Cualquiera puede leer juegos. Nadie los escribe desde el navegador: solo el
-- servidor con la clave secreta (que saltea RLS) al copiar datos de IGDB.
create policy "games are public" on public.games for select using (true);
revoke insert, update, delete on public.games from anon, authenticated;

-- -----------------------------------------------------------------------------
-- ratings: una calificación por usuario y juego.
-- -----------------------------------------------------------------------------
create table public.ratings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  game_id      bigint not null references public.games (id) on delete cascade,
  score        smallint not null check (score between 1 and 100),
  review       text check (char_length(review) <= 5000),
  has_spoilers boolean not null default false,
  hours_played numeric(6,1) check (hours_played between 0 and 9999.9),
  finished_on  date check (finished_on >= date '1970-01-01'),
  is_hidden    boolean not null default false,       -- lo usa la moderación (Fase 4)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, game_id)
);

create index ratings_game_idx on public.ratings (game_id);
create index ratings_user_recent_idx on public.ratings (user_id, updated_at desc);

-- Antes de guardar: fecha de edición, fecha de finalización no futura y
-- límite anti-spam de 60 calificaciones nuevas o editadas por hora.
create function public.ratings_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();

  if new.finished_on is not null and new.finished_on > current_date then
    raise exception using errcode = 'P0001', message = 'finished_on_in_future';
  end if;

  if (select count(*) from public.ratings r
      where r.user_id = new.user_id
        and r.updated_at > now() - interval '1 hour'
        and r.id <> new.id) >= 60 then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  end if;

  return new;
end;
$$;

create trigger ratings_before_write
  before insert or update on public.ratings
  for each row execute function public.ratings_before_write();

-- -----------------------------------------------------------------------------
-- La nota de la comunidad (spec §5.2):
--   1. Voto válido: email confirmado + cuenta de al menos 3 días + no suspendido.
--   2. Media recortada: se ordenan los votos válidos y se descarta el 10 % más
--      bajo y el 10 % más alto (floor(n * 0.10) de cada lado); se promedia el resto.
--   3. Con menos de 5 votos válidos no hay nota (NULL).
-- -----------------------------------------------------------------------------
create function public.refresh_game_stats(p_game_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_trimmed numeric;
  v_valid   int;
begin
  with valid as (
    select r.score, r.hours_played
    from public.ratings r
    join auth.users u on u.id = r.user_id
    join public.profiles p on p.id = r.user_id
    where r.game_id = p_game_id
      and u.email_confirmed_at is not null
      and u.created_at <= now() - interval '3 days'
      and p.is_suspended = false
  ),
  ranked as (
    select score,
           row_number() over (order by score) as rn,
           count(*) over () as n
    from valid
  )
  select avg(score) filter (where rn > floor(n * 0.10) and rn <= n - floor(n * 0.10)),
         count(*)
    into v_trimmed, v_valid
  from ranked;

  update public.games g set
    valid_ratings_count = v_valid,
    community_score = case when v_valid >= 5 then round(v_trimmed)::smallint end,
    score_distribution = s.distribution,
    avg_hours = s.avg_hours,
    ratings_count = c.ratings_count,
    reviews_count = c.reviews_count,
    updated_at = now()
  from (
    select array[
             count(*) filter (where r.score between 1 and 39),
             count(*) filter (where r.score between 40 and 59),
             count(*) filter (where r.score between 60 and 74),
             count(*) filter (where r.score between 75 and 84),
             count(*) filter (where r.score between 85 and 89),
             count(*) filter (where r.score between 90 and 94),
             count(*) filter (where r.score between 95 and 100)
           ]::int[] as distribution,
           round(avg(r.hours_played), 1) as avg_hours
    from public.ratings r
    join auth.users u on u.id = r.user_id
    join public.profiles p on p.id = r.user_id
    where r.game_id = p_game_id
      and u.email_confirmed_at is not null
      and u.created_at <= now() - interval '3 days'
      and p.is_suspended = false
  ) s,
  (
    select count(*)::int as ratings_count,
           count(*) filter (where nullif(trim(r.review), '') is not null)::int as reviews_count
    from public.ratings r
    where r.game_id = p_game_id and r.is_hidden = false
  ) c
  where g.id = p_game_id;
end;
$$;

-- Recalcular cada vez que se crea, edita o borra una calificación.
create function public.ratings_after_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.refresh_game_stats(old.game_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') and (tg_op = 'INSERT' or new.game_id <> old.game_id) then
    perform public.refresh_game_stats(new.game_id);
  end if;
  return null;
end;
$$;

create trigger ratings_after_write
  after insert or update or delete on public.ratings
  for each row execute function public.ratings_after_write();

-- Recálculo diario: una cuenta que cumple 3 días empieza a contar aunque
-- ninguna calificación haya cambiado.
create function public.refresh_all_game_stats()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
begin
  for v_id in select id from public.games loop
    perform public.refresh_game_stats(v_id);
  end loop;
end;
$$;

revoke execute on function public.refresh_game_stats(bigint) from public, anon, authenticated;
revoke execute on function public.refresh_all_game_stats() from public, anon, authenticated;
revoke execute on function public.ratings_before_write() from public, anon, authenticated;
revoke execute on function public.ratings_after_write() from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('refresh-game-stats', '15 3 * * *', 'select public.refresh_all_game_stats()');

-- Consulta mínima que usa el cron de Vercel una vez por día para que el
-- proyecto gratuito de Supabase no se pause por inactividad.
create function public.ping() returns int language sql stable as 'select 1';
grant execute on function public.ping() to anon;

-- -----------------------------------------------------------------------------
-- RLS de ratings.
-- -----------------------------------------------------------------------------
alter table public.ratings enable row level security;

-- Se ven las calificaciones no ocultas de autores no suspendidos; las propias, siempre.
create policy "ratings are public unless hidden" on public.ratings for select
  using (
    user_id = (select auth.uid())
    or (is_hidden = false
        and exists (select 1 from public.profiles p where p.id = user_id and p.is_suspended = false))
  );

-- Solo podés crear, editar o borrar tus propias calificaciones, y no si estás suspendido.
create policy "users insert their own ratings" on public.ratings for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_suspended = false)
  );

create policy "users update their own ratings" on public.ratings for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_suspended = false)
  );

create policy "users delete their own ratings" on public.ratings for delete to authenticated
  using (user_id = (select auth.uid()));

-- Columnas que el usuario puede tocar. is_hidden, user_id y game_id no.
revoke insert, update on public.ratings from anon, authenticated;
grant insert (user_id, game_id, score, review, has_spoilers, hours_played, finished_on)
  on public.ratings to authenticated;
grant update (score, review, has_spoilers, hours_played, finished_on)
  on public.ratings to authenticated;

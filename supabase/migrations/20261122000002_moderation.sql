-- =============================================================================
-- Fase 4 — Reportes y moderación (spec §5.4 y §8).
--
-- Cualquier jugador puede reportar una reseña ajena. Solo un administrador
-- (profiles.is_admin, que nadie puede cambiar desde la página) puede ocultar
-- reseñas, suspender cuentas y cerrar reportes. Esas acciones son funciones
-- "security definer" (corren con permisos del dueño de la base, por encima de
-- RLS) que lo PRIMERO que hacen es verificar is_admin(): la regla "solo el
-- admin" vive en la base, no solo en la página.
-- =============================================================================

-- ¿Quien llama es administrador? Sin sesión: false.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select is_admin from public.profiles where id = (select auth.uid())), false);
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- reports: un reporte por persona y reseña.
-- -----------------------------------------------------------------------------
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  rating_id   uuid not null references public.ratings (id) on delete cascade,
  reason      text not null check (reason in ('spam', 'offensive', 'spoilers', 'other')),
  details     text check (char_length(details) <= 500),
  status      text not null default 'open' check (status in ('open', 'resolved')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  unique (reporter_id, rating_id)
);
create index reports_open_idx on public.reports (created_at) where status = 'open';

alter table public.reports enable row level security;

-- Reportar: a tu nombre, sin estar suspendido, sobre una reseña ajena, visible
-- y con texto (igual que votar "útil").
create policy "users report others' reviews" on public.reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_suspended = false)
    and exists (
      select 1 from public.ratings r
      where r.id = rating_id
        and r.user_id <> (select auth.uid())
        and nullif(trim(r.review), '') is not null
        and r.is_hidden = false
    )
  );

-- Ver reportes: cada uno los suyos; el admin, todos.
create policy "reporters and admins read reports" on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()) or (select public.is_admin()));

revoke all on public.reports from anon, authenticated;
grant select on public.reports to authenticated;
grant insert (reporter_id, rating_id, reason, details) on public.reports to authenticated;

-- -----------------------------------------------------------------------------
-- Acciones de moderación (solo admin).
-- -----------------------------------------------------------------------------

-- Ocultar o mostrar una reseña. El trigger de ratings (por columna is_hidden)
-- recalcula el juego. Ocultar cierra los reportes abiertos de esa reseña.
create function public.moderate_rating(p_rating_id uuid, p_hidden boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  update public.ratings set is_hidden = p_hidden where id = p_rating_id;
  if p_hidden then
    update public.reports set status = 'resolved', resolved_at = now()
    where rating_id = p_rating_id and status = 'open';
  end if;
end;
$$;

-- Suspender o reactivar una cuenta. Sus votos dejan (o vuelven) a ser válidos,
-- así que se recalcula la nota de cada juego que calificó.
create function public.set_suspended(p_user_id uuid, p_suspended boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_game_id bigint;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  update public.profiles set is_suspended = p_suspended where id = p_user_id;
  for v_game_id in select game_id from public.ratings where user_id = p_user_id loop
    perform public.refresh_game_stats(v_game_id);
  end loop;
end;
$$;

-- Cerrar un reporte sin tocar la reseña ("descartar").
create function public.resolve_report(p_report_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  update public.reports set status = 'resolved', resolved_at = now() where id = p_report_id;
end;
$$;

-- Cola de reportes abiertos para el panel, los más viejos primero. Es security
-- definer porque el admin necesita ver reseñas ocultas y autores suspendidos,
-- que las reglas RLS normales esconden.
create function public.open_reports()
returns table (
  report_id uuid, rating_id uuid, reason text, details text, created_at timestamptz,
  reporter text, author text, author_id uuid, author_suspended boolean,
  review text, is_hidden boolean, score smallint, game_slug text, game_name text,
  reports_on_rating int
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  return query
  select rp.id, rp.rating_id, rp.reason, rp.details, rp.created_at,
         reporter.username, author.username, author.id, author.is_suspended,
         r.review, r.is_hidden, r.score, g.slug, g.name,
         (select count(*)::int from public.reports x where x.rating_id = rp.rating_id and x.status = 'open')
  from public.reports rp
  join public.ratings r on r.id = rp.rating_id
  join public.games g on g.id = r.game_id
  join public.profiles reporter on reporter.id = rp.reporter_id
  join public.profiles author on author.id = r.user_id
  where rp.status = 'open'
  order by rp.created_at;
end;
$$;

revoke execute on function public.moderate_rating(uuid, boolean), public.set_suspended(uuid, boolean),
  public.resolve_report(uuid), public.open_reports() from public, anon;
grant execute on function public.moderate_rating(uuid, boolean), public.set_suspended(uuid, boolean),
  public.resolve_report(uuid), public.open_reports() to authenticated;

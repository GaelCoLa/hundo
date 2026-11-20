-- Corrige una carrera en refresh_game_stats: dos calificaciones simultáneas
-- del mismo juego podían dejar estadísticas desactualizadas hasta el recálculo
-- nocturno. La función queda igual salvo el bloqueo inicial.
create or replace function public.refresh_game_stats(p_game_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_trimmed numeric;
  v_valid   int;
begin
  -- Bloquear la fila del juego ANTES de contar. Si dos personas califican el
  -- mismo juego a la vez, la segunda espera a que termine la primera y recién
  -- entonces cuenta, viendo también ese voto (en READ COMMITTED cada consulta
  -- siguiente toma una foto nueva de la base). Sin esto, la segunda podía
  -- guardar números que no incluían el voto de la primera.
  perform 1 from public.games where id = p_game_id for update;

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

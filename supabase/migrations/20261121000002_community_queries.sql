-- =============================================================================
-- Fase 3 — Consultas de la comunidad que necesitan agrupar o contar: géneros
-- con ranking, puesto de un juego en su género, juegos destacados y ranking de
-- jugadores. La página las llama con supabase.rpc("nombre", { parámetros }).
--
-- Todas son "security invoker" (la opción por defecto): corren con los permisos
-- de quien las llama, así las reglas RLS siguen valiendo (por ejemplo, las
-- calificaciones ocultas o de cuentas suspendidas no cuentan). "stable" le dice
-- a Postgres que solo leen datos, lo que le permite optimizarlas.
-- =============================================================================

-- Búsqueda por género: "games cuyos géneros contienen X" (spec §8).
create index games_genres_idx on public.games using gin (genres);

-- -----------------------------------------------------------------------------
-- Géneros que tienen al menos un juego con nota de la comunidad, y cuántos.
-- Son los "chips" de filtro de Explorar.
-- -----------------------------------------------------------------------------
create function public.list_genres()
returns table (genre text, games int)
language sql
stable
set search_path = ''
as $$
  select g.genre, count(*)::int as games
  from public.games, unnest(genres) as g(genre)
  where valid_ratings_count >= 5 and community_score is not null
  group by g.genre
  order by games desc, g.genre;
$$;

-- -----------------------------------------------------------------------------
-- Puesto de un juego dentro de su primer género (spec §5.4: "puesto en su
-- género"). rank(): los empates comparten puesto (dos juegos con 80 son #2).
-- Sin nota o sin géneros: ninguna fila (la ficha no muestra el puesto).
-- -----------------------------------------------------------------------------
create function public.genre_rank(p_game_id bigint)
returns table (genre text, "position" int, total int)
language sql
stable
set search_path = ''
as $$
  with target as (
    select genres[1] as genre, community_score
    from public.games
    where id = p_game_id and community_score is not null and cardinality(genres) > 0
  )
  select t.genre,
         (select count(*) + 1 from public.games o
           where o.genres @> array[t.genre] and o.community_score > t.community_score)::int,
         (select count(*) from public.games o
           where o.genres @> array[t.genre] and o.community_score is not null)::int
  from target t;
$$;

-- -----------------------------------------------------------------------------
-- Destacados de la portada (spec §5.4, decisión del constructor): los juegos
-- más calificados en los últimos 30 días. Desempate: mejor nota.
-- -----------------------------------------------------------------------------
create function public.featured_games(p_limit int default 6)
returns setof public.games
language sql
stable
set search_path = ''
as $$
  select g.*
  from public.games g
  join (
    select game_id, count(*) as recent
    from public.ratings
    where is_hidden = false and created_at >= now() - interval '30 days'
    group by game_id
  ) r on r.game_id = g.id
  order by r.recent desc, g.community_score desc nulls last, g.id
  limit least(greatest(p_limit, 1), 24);
$$;

-- -----------------------------------------------------------------------------
-- Ranking de jugadores para la página Jugadores:
--   'helpful' → los que más "útil" recibieron (Top reviewers);
--   'active'  → los que más juegos calificaron.
-- Cualquier otro orden es un error (no se arma SQL con texto del usuario).
-- -----------------------------------------------------------------------------
create function public.top_players(p_order text, p_limit int default 20)
returns table (username text, helpful_received int, ratings_count int, created_at timestamptz)
language plpgsql
stable
set search_path = ''
as $$
begin
  if p_order is null or p_order not in ('helpful', 'active') then
    raise exception 'invalid_order';
  end if;

  return query
  select p.username, p.helpful_received, c.n::int, p.created_at
  from public.profiles p
  cross join lateral (
    select count(*) as n from public.ratings r
    where r.user_id = p.id and r.is_hidden = false
  ) c
  where (p_order = 'helpful' and p.helpful_received > 0)
     or (p_order = 'active' and c.n > 0)
  order by case when p_order = 'helpful' then p.helpful_received::bigint else c.n end desc, p.username
  limit least(greatest(p_limit, 1), 100);
end;
$$;

revoke execute on function public.list_genres(), public.genre_rank(bigint), public.featured_games(int), public.top_players(text, int) from public;
grant execute on function public.list_genres(), public.genre_rank(bigint), public.featured_games(int), public.top_players(text, int) to anon, authenticated;

-- =============================================================================
-- Consultas de la comunidad: puesto en el género, géneros con ranking, juegos
-- destacados y ranking de jugadores. Transacción con rollback: no deja datos.
--   npx supabase db query --remote --yes --file supabase/tests/community_queries.sql
-- (Supone una base de desarrollo sin otros juegos con nota en "Shooter".)
-- =============================================================================
begin;

-- Juegos de ranking SIN calificaciones (el trigger nunca les recalcula la nota):
-- la nota y los votos se fijan a mano.
insert into public.games (id, slug, name, igdb_synced_at, genres, community_score, valid_ratings_count) values
  (999100001, 'q-a', 'A', now(), '{Shooter,Horror}', 90, 5),
  (999100002, 'q-b', 'B', now(), '{Shooter}', 80, 6),
  (999100003, 'q-c', 'C', now(), '{Shooter}', 80, 5),
  (999100004, 'q-d', 'D', now(), '{Horror}', null, 2),
  (999100005, 'q-e', 'E', now(), '{}', 70, 5);

do $$
declare r record;
begin
  select * into r from public.genre_rank(999100001);
  assert r.genre = 'Shooter' and r.position = 1 and r.total = 3, 'A debe ser #1 de 3 en Shooter';
  assert (select position from public.genre_rank(999100002)) = 2, 'B debe ser #2';
  assert (select position from public.genre_rank(999100003)) = 2, 'C empata con B en #2';
  assert (select count(*) from public.genre_rank(999100004)) = 0, 'sin nota no hay puesto';
  assert (select count(*) from public.genre_rank(999100005)) = 0, 'sin generos no hay puesto';
  assert exists (select 1 from public.list_genres() where genre = 'Shooter' and games = 3), 'Shooter tiene 3 juegos con nota';
  assert exists (select 1 from public.list_genres() where genre = 'Horror' and games = 1), 'Horror cuenta solo A (D no tiene nota)';
end $$;

-- Destacados: calificaciones de los últimos 30 días.
insert into public.games (id, slug, name, igdb_synced_at) values
  (999100010, 'q-f1', 'F1', now()),
  (999100011, 'q-f2', 'F2', now()),
  (999100012, 'q-f3', 'F3', now());
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
select ('00000000-0000-0000-0000-00000000f0' || lpad(i::text, 2, '0'))::uuid,
       '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'q-' || i || '@example.com', jsonb_build_object('username', 'q_user_' || i), now(), now(), now()
from generate_series(1, 3) as i;
insert into public.ratings (user_id, game_id, score) values
  ('00000000-0000-0000-0000-00000000f001', 999100010, 70),
  ('00000000-0000-0000-0000-00000000f002', 999100010, 75),
  ('00000000-0000-0000-0000-00000000f003', 999100011, 80),
  ('00000000-0000-0000-0000-00000000f001', 999100012, 60);
update public.ratings set created_at = now() - interval '40 days' where game_id = 999100012;

do $$
declare ids bigint[];
begin
  -- Orden relativo (la base de desarrollo puede tener otros juegos destacados,
  -- por ejemplo los del dev-seed): F1 antes que F2, y F3 afuera.
  select array_agg(id) into ids from public.featured_games(24);
  assert array_position(ids, 999100010) < array_position(ids, 999100011), 'F1 (2 calificaciones recientes) va antes que F2 (1)';
  assert not (999100012 = any(ids)), 'F3 (calificacion de hace 40 dias) no es destacado';
end $$;

-- Jugadores.
update public.profiles set helpful_received = 7 where id = '00000000-0000-0000-0000-00000000f001';
do $$ begin
  -- Orden relativo (en desarrollo puede haber otros jugadores con más "útil"):
  -- u1 (7) va antes que u2 (0 → ni aparece, porque solo entran los que tienen alguno).
  assert exists (select 1 from public.top_players('helpful', 20) where username = 'q_user_1'), 'u1 aparece en Top reviewers';
  assert not exists (select 1 from public.top_players('helpful', 20) where username = 'q_user_2'), 'sin util no aparece en Top reviewers';
  assert (select helpful_received from public.top_players('helpful', 20) where username = 'q_user_1') = 7, 'u1 tiene 7 util';
  assert (select ratings_count from public.top_players('active', 20) where username = 'q_user_1') = 2, 'u1 tiene 2 calificaciones';
  begin
    perform public.top_players('x', 20);
    assert false, 'un orden invalido debe fallar';
  exception when others then
    assert sqlerrm = 'invalid_order', 'el error debe ser invalid_order';
  end;
end $$;

select 'community queries tests passed' as result;
rollback;

-- =============================================================================
-- Prueba de la nota de la comunidad (media recortada + votos válidos + mínimo 5).
-- Corre dentro de una transacción que se deshace al final: no deja datos.
--   npx supabase db query --remote --yes --file supabase/tests/score.sql
-- Si alguna verificación falla, Postgres corta con "assert ... failed".
-- =============================================================================
begin;

insert into public.games (id, slug, name, igdb_synced_at)
values (999000001, 'test-game-score', 'Test Game', now());

-- Usuarios de prueba: 10 válidos (email confirmado, cuenta de 10 días),
-- 1 con cuenta nueva (1 día) y 1 sin email confirmado.
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
select ('00000000-0000-0000-0000-0000000000' || lpad(i::text, 2, '0'))::uuid,
       '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'score-test-' || i || '@example.com',
       jsonb_build_object('username', 'score_test_' || i),
       case when i = 12 then null else now() end,
       case when i = 11 then now() - interval '1 day' else now() - interval '10 days' end,
       now()
from generate_series(1, 12) as i;

create function pg_temp.u(i int) returns uuid language sql as
  $$ select ('00000000-0000-0000-0000-0000000000' || lpad(i::text, 2, '0'))::uuid $$;

create function pg_temp.g() returns public.games language sql as
  $$ select * from public.games where id = 999000001 $$;

-- 4 votos válidos: todavía no hay nota.
insert into public.ratings (user_id, game_id, score) values
  (pg_temp.u(1), 999000001, 90), (pg_temp.u(2), 999000001, 92),
  (pg_temp.u(3), 999000001, 94), (pg_temp.u(4), 999000001, 96);
do $$ begin
  assert (pg_temp.g()).community_score is null, 'con 4 votos no debe haber nota';
  assert (pg_temp.g()).valid_ratings_count = 4, 'deben contar 4 votos validos';
end $$;

-- 5.º voto válido: aparece la nota. n=5, recorte 0 → media de 90,92,94,96,98 = 94.
insert into public.ratings (user_id, game_id, score) values (pg_temp.u(5), 999000001, 98);
do $$ begin
  assert (pg_temp.g()).community_score = 94, 'con 5 votos la nota debe ser 94';
end $$;

-- n=10 → se descarta 1 de cada extremo (el 1 y el 98).
-- Quedan 90,92,94,95,95,95,95,96 → 752 / 8 = 94.
insert into public.ratings (user_id, game_id, score) values
  (pg_temp.u(6), 999000001, 95), (pg_temp.u(7), 999000001, 95),
  (pg_temp.u(8), 999000001, 95), (pg_temp.u(9), 999000001, 95),
  (pg_temp.u(10), 999000001, 1);
do $$ begin
  assert (pg_temp.g()).community_score = 94, 'el troll con 1 no debe mover la nota (media recortada)';
  assert (pg_temp.g()).valid_ratings_count = 10, 'deben contar 10 votos validos';
  assert (pg_temp.g()).score_distribution = '{1,0,0,0,0,7,2}', 'distribucion por categoria incorrecta';
end $$;

-- Cuenta nueva (1 día) y cuenta sin email confirmado: se guardan, pero no cuentan.
insert into public.ratings (user_id, game_id, score) values
  (pg_temp.u(11), 999000001, 1), (pg_temp.u(12), 999000001, 1);
do $$ begin
  assert (pg_temp.g()).community_score = 94, 'votos no validos no deben mover la nota';
  assert (pg_temp.g()).valid_ratings_count = 10, 'votos no validos no deben contarse';
  assert (pg_temp.g()).ratings_count = 12, 'ratings_count incluye todas las calificaciones';
end $$;

-- Horas promedio solo de votos válidos; reseñas cuentan si tienen texto.
update public.ratings set hours_played = 10, review = 'Muy bueno' where user_id = pg_temp.u(1);
update public.ratings set hours_played = 20 where user_id = pg_temp.u(2);
update public.ratings set hours_played = 999, review = '   ' where user_id = pg_temp.u(11);
do $$ begin
  assert (pg_temp.g()).avg_hours = 15.0, 'horas promedio: solo validos (10 y 20)';
  assert (pg_temp.g()).reviews_count = 1, 'una sola resena con texto';
end $$;

-- Fecha de finalización en el futuro: rechazada.
do $$ begin
  begin
    update public.ratings set finished_on = current_date + 1 where user_id = pg_temp.u(1);
    assert false, 'una fecha futura debio ser rechazada';
  exception when raise_exception or check_violation then null;
  end;
end $$;

-- Borrar calificaciones recalcula: con 4 válidos vuelve a no haber nota.
delete from public.ratings where user_id in (pg_temp.u(5), pg_temp.u(6), pg_temp.u(7), pg_temp.u(8), pg_temp.u(9), pg_temp.u(10));
do $$ begin
  assert (pg_temp.g()).community_score is null, 'al bajar de 5 votos validos la nota desaparece';
end $$;

select 'score tests passed' as result;
rollback;

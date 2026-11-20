-- =============================================================================
-- Reglas de seguridad y contadores de la comunidad: "útil" (review_likes) y
-- seguir (follows). Transacción con rollback: no deja datos.
--   npx supabase db query --remote --yes --file supabase/tests/community_rls.sql
-- =============================================================================
begin;

insert into public.games (id, slug, name, igdb_synced_at) values
  (999000005, 'test-community-5', 'Community 5', now()),
  (999000006, 'test-community-6', 'Community 6', now()),
  (999000007, 'test-community-7', 'Community 7', now());

-- a1 vota, b2 escribe reseñas, c3 es un tercero.
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, email_confirmed_at, created_at, updated_at) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'com-a@example.com', '{"username":"com_a"}', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'com-b@example.com', '{"username":"com_b"}', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'com-c@example.com', '{"username":"com_c"}', now(), now(), now());

-- Calificaciones de b2: con reseña (5), sin reseña (7) y oculta con reseña (6).
-- a1 tiene una propia con reseña (5). c3 ya sigue a b2.
insert into public.ratings (user_id, game_id, score, review) values
  ('00000000-0000-0000-0000-0000000000b2', 999000005, 90, 'Gran juego'),
  ('00000000-0000-0000-0000-0000000000b2', 999000007, 70, null),
  ('00000000-0000-0000-0000-0000000000b2', 999000006, 60, 'Oculta'),
  ('00000000-0000-0000-0000-0000000000a1', 999000005, 80, 'Mi reseña');
update public.ratings set is_hidden = true where user_id = '00000000-0000-0000-0000-0000000000b2' and game_id = 999000006;
insert into public.follows (follower_id, followee_id) values ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000b2');

-- Guardar los ids de las calificaciones (el visitante no ve la oculta).
select set_config('test.b2_review', (select id::text from public.ratings where user_id = '00000000-0000-0000-0000-0000000000b2' and game_id = 999000005), true);
select set_config('test.b2_plain', (select id::text from public.ratings where user_id = '00000000-0000-0000-0000-0000000000b2' and game_id = 999000007), true);
select set_config('test.b2_hidden', (select id::text from public.ratings where user_id = '00000000-0000-0000-0000-0000000000b2' and game_id = 999000006), true);
select set_config('test.a1_review', (select id::text from public.ratings where user_id = '00000000-0000-0000-0000-0000000000a1' and game_id = 999000005), true);

-- ---------------------------------------------------------------- como a1 ---
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

insert into public.review_likes (user_id, rating_id)
values ('00000000-0000-0000-0000-0000000000a1', current_setting('test.b2_review')::uuid);

do $$ begin
  assert (select helpful_count from public.ratings where id = current_setting('test.b2_review')::uuid) = 1,
    'el like debe sumar 1 a helpful_count';
  assert (select helpful_received from public.profiles where id = '00000000-0000-0000-0000-0000000000b2') = 1,
    'el like debe sumar 1 a helpful_received del autor';

  begin
    insert into public.review_likes (user_id, rating_id) values ('00000000-0000-0000-0000-0000000000a1', current_setting('test.b2_review')::uuid);
    assert false, 'no deberia poder votar dos veces';
  exception when unique_violation then null; end;

  begin
    insert into public.review_likes (user_id, rating_id) values ('00000000-0000-0000-0000-0000000000a1', current_setting('test.a1_review')::uuid);
    assert false, 'no deberia poder votar su propia reseña';
  exception when insufficient_privilege then null; end;

  begin
    insert into public.review_likes (user_id, rating_id) values ('00000000-0000-0000-0000-0000000000a1', current_setting('test.b2_plain')::uuid);
    assert false, 'no deberia poder votar una calificacion sin reseña';
  exception when insufficient_privilege then null; end;

  begin
    insert into public.review_likes (user_id, rating_id) values ('00000000-0000-0000-0000-0000000000a1', current_setting('test.b2_hidden')::uuid);
    assert false, 'no deberia poder votar una reseña oculta';
  exception when insufficient_privilege then null; end;

  begin
    insert into public.review_likes (user_id, rating_id) values ('00000000-0000-0000-0000-0000000000c3', current_setting('test.b2_review')::uuid);
    assert false, 'no deberia poder votar a nombre de otro';
  exception when insufficient_privilege then null; end;

  delete from public.review_likes where user_id = '00000000-0000-0000-0000-0000000000a1';
  assert (select helpful_count from public.ratings where id = current_setting('test.b2_review')::uuid) = 0,
    'quitar el like debe restar helpful_count';
  assert (select helpful_received from public.profiles where id = '00000000-0000-0000-0000-0000000000b2') = 0,
    'quitar el like debe restar helpful_received';

  begin
    update public.ratings set helpful_count = 999 where id = current_setting('test.a1_review')::uuid;
    assert false, 'helpful_count no se puede editar a mano';
  exception when insufficient_privilege then null; end;

  begin
    update public.profiles set helpful_received = 999 where id = '00000000-0000-0000-0000-0000000000a1';
    assert false, 'helpful_received no se puede editar a mano';
  exception when insufficient_privilege then null; end;

  -- Seguir.
  insert into public.follows (follower_id, followee_id) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b2');

  begin
    insert into public.follows (follower_id, followee_id) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b2');
    assert false, 'no deberia poder seguir dos veces';
  exception when unique_violation then null; end;

  begin
    insert into public.follows (follower_id, followee_id) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1');
    assert false, 'no deberia poder seguirse a si mismo';
  exception when check_violation then null; end;

  begin
    insert into public.follows (follower_id, followee_id) values ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000a1');
    assert false, 'no deberia poder seguir a nombre de otro';
  exception when insufficient_privilege then null; end;

  -- No puede deshacer el seguimiento de c3 (RLS: 0 filas).
  delete from public.follows where follower_id = '00000000-0000-0000-0000-0000000000c3';
  assert (select count(*) from public.follows where follower_id = '00000000-0000-0000-0000-0000000000c3') = 1,
    'no deberia poder borrar el seguimiento de otro';
end $$;

-- ------------------------------------------------------- b2 suspendido ---
reset role;
update public.profiles set is_suspended = true where id = '00000000-0000-0000-0000-0000000000b2';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
do $$ begin
  assert (select count(*) from public.ratings where user_id = '00000000-0000-0000-0000-0000000000b2') = 0,
    'las calificaciones de un suspendido no se ven';
  begin
    insert into public.review_likes (user_id, rating_id) values ('00000000-0000-0000-0000-0000000000a1', current_setting('test.b2_review')::uuid);
    assert false, 'no deberia poder votar a un suspendido';
  exception when insufficient_privilege then null; end;
end $$;

-- ------------------------------------------------------- c3 suspendido ---
reset role;
update public.profiles set is_suspended = false where id = '00000000-0000-0000-0000-0000000000b2';
update public.profiles set is_suspended = true where id = '00000000-0000-0000-0000-0000000000c3';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c3","role":"authenticated"}', true);
do $$ begin
  begin
    insert into public.review_likes (user_id, rating_id) values ('00000000-0000-0000-0000-0000000000c3', current_setting('test.b2_review')::uuid);
    assert false, 'un suspendido no deberia poder votar';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.follows (follower_id, followee_id) values ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000a1');
    assert false, 'un suspendido no deberia poder seguir';
  exception when insufficient_privilege then null; end;
end $$;

-- ------------------------------- borrar una reseña con likes descuenta ---
reset role;
insert into public.review_likes (user_id, rating_id) values ('00000000-0000-0000-0000-0000000000a1', current_setting('test.b2_review')::uuid);
do $$ begin
  assert (select helpful_received from public.profiles where id = '00000000-0000-0000-0000-0000000000b2') = 1, 'preparacion: 1 like';
end $$;
delete from public.ratings where id = current_setting('test.b2_review')::uuid;
do $$ begin
  assert (select helpful_received from public.profiles where id = '00000000-0000-0000-0000-0000000000b2') = 0,
    'borrar la reseña debe descontar sus likes (exactamente una vez)';
end $$;

select 'community rls tests passed' as result;
rollback;

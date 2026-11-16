-- Reglas de seguridad (RLS) de ratings. Transacción con rollback: no deja datos.
--   npx supabase db query --remote --yes --file supabase/tests/ratings_rls.sql
begin;

insert into public.games (id, slug, name, igdb_synced_at) values (999000002, 'test-game-rls', 'RLS Game', now());
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, email_confirmed_at, created_at, updated_at) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-a@example.com', '{"username":"rls_a"}', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-b@example.com', '{"username":"rls_b"}', now(), now(), now());
insert into public.ratings (user_id, game_id, score) values ('00000000-0000-0000-0000-0000000000b2', 999000002, 50);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

-- Puede calificar a su nombre.
insert into public.ratings (user_id, game_id, score) values ('00000000-0000-0000-0000-0000000000a1', 999000002, 80);

do $$ begin
  -- No puede calificar a nombre de otro.
  begin
    insert into public.ratings (user_id, game_id, score) values ('00000000-0000-0000-0000-0000000000b2', 999000002, 1);
    assert false, 'no deberia poder calificar por otro usuario';
  exception when insufficient_privilege or unique_violation then null; end;

  -- No puede ocultarse ni ocultar reseñas (is_hidden es de moderación).
  begin
    update public.ratings set is_hidden = true where user_id = '00000000-0000-0000-0000-0000000000a1';
    assert false, 'no deberia poder cambiar is_hidden';
  exception when insufficient_privilege then null; end;
end $$;

-- No puede editar ni borrar la calificación de otro (RLS la deja fuera: 0 filas).
update public.ratings set score = 1 where user_id = '00000000-0000-0000-0000-0000000000b2';
delete from public.ratings where user_id = '00000000-0000-0000-0000-0000000000b2';
reset role;
do $$ begin
  assert (select count(*) from public.ratings where user_id = '00000000-0000-0000-0000-0000000000b2' and score = 50) = 1,
    'la calificacion ajena no debe cambiar ni borrarse';
end $$;

set local role authenticated;
-- No puede escribir en games.
do $$ begin
  begin
    insert into public.games (id, slug, name, igdb_synced_at) values (999000003, 'hack', 'Hack', now());
    assert false, 'no deberia poder insertar juegos';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
select 'ratings rls tests passed' as result;
rollback;

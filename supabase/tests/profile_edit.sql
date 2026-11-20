-- =============================================================================
-- Perfil editable: Top 5 favoritos (tabla favorites) y carpeta de avatares en
-- Supabase Storage. Transacción con rollback: no deja datos.
--   npx supabase db query --remote --yes --file supabase/tests/profile_edit.sql
-- =============================================================================
begin;

insert into public.games (id, slug, name, igdb_synced_at)
select 999200000 + i, 'fav-' || i, 'Fav ' || i, now() from generate_series(1, 6) as i;

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, email_confirmed_at, created_at, updated_at) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fav-1@example.com', '{"username":"fav_one"}', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fav-2@example.com', '{"username":"fav_two"}', now(), now(), now());

-- f1 calificó los juegos 1 a 5 (no el 6); f2 calificó el 1 y ya tiene un favorito.
insert into public.ratings (user_id, game_id, score)
select '00000000-0000-0000-0000-0000000000f1', 999200000 + i, 80 from generate_series(1, 5) as i;
insert into public.ratings (user_id, game_id, score) values ('00000000-0000-0000-0000-0000000000f2', 999200001, 70);
insert into public.favorites (user_id, position, game_id) values ('00000000-0000-0000-0000-0000000000f2', 1, 999200001);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated"}', true);

insert into public.favorites (user_id, position, game_id)
select '00000000-0000-0000-0000-0000000000f1', i, 999200000 + i from generate_series(1, 5) as i;

do $$ begin
  assert (select count(*) from public.favorites where user_id = '00000000-0000-0000-0000-0000000000f1') = 5, 'f1 debe tener 5 favoritos';

  -- Libera el juego 5 para probar solo el límite de posición (juego calificado, puesto 6).
  delete from public.favorites where user_id = '00000000-0000-0000-0000-0000000000f1' and position = 5;
  begin
    insert into public.favorites (user_id, position, game_id) values ('00000000-0000-0000-0000-0000000000f1', 6, 999200005);
    assert false, 'no puede haber posicion 6';
  exception when check_violation then null; end;
  begin
    insert into public.favorites (user_id, position, game_id) values ('00000000-0000-0000-0000-0000000000f1', 5, 999200001);
    assert false, 'no puede repetir un juego';
  exception when unique_violation then null; end;

  begin
    insert into public.favorites (user_id, position, game_id) values ('00000000-0000-0000-0000-0000000000f1', 5, 999200006);
    assert false, 'no puede elegir un juego que no califico';
  exception when insufficient_privilege then null; end;

  begin
    insert into public.favorites (user_id, position, game_id) values ('00000000-0000-0000-0000-0000000000f2', 2, 999200001);
    assert false, 'no puede editar los favoritos de otro';
  exception when insufficient_privilege then null; end;

  delete from public.favorites where user_id = '00000000-0000-0000-0000-0000000000f2';
  assert (select count(*) from public.favorites where user_id = '00000000-0000-0000-0000-0000000000f2') = 1,
    'no puede borrar los favoritos de otro';

  -- Avatares: solo en su propia carpeta.
  insert into storage.objects (bucket_id, name) values ('avatars', '00000000-0000-0000-0000-0000000000f1/1.png');
  begin
    insert into storage.objects (bucket_id, name) values ('avatars', '00000000-0000-0000-0000-0000000000f2/1.png');
    assert false, 'no puede subir a la carpeta de otro';
  exception when insufficient_privilege then null; end;

  begin
    update public.profiles set bio = repeat('x', 301) where id = '00000000-0000-0000-0000-0000000000f1';
    assert false, 'la bio tiene maximo 300 caracteres';
  exception when check_violation then null; end;
end $$;

reset role;
select 'profile edit tests passed' as result;
rollback;

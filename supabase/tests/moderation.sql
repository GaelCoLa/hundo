-- =============================================================================
-- Reportes y moderación: quién puede reportar, que solo el admin modere, y que
-- ocultar/suspender tenga efecto. Transacción con rollback: no deja datos.
--   npx supabase db query --remote --yes --file supabase/tests/moderation.sql
-- =============================================================================
begin;

insert into public.games (id, slug, name, igdb_synced_at) values (999300001, 'mod-game', 'Mod Game', now());

-- m1 admin, m2 autor, m3 reportero, x1..x4 votantes válidos (cuentas de 10 días).
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
select v.id::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v.email,
       jsonb_build_object('username', v.username), now(), now() - interval '10 days', now()
from (values
  ('00000000-0000-0000-0000-0000000000d1', 'mod-1@example.com', 'mod_admin'),
  ('00000000-0000-0000-0000-0000000000d2', 'mod-2@example.com', 'mod_author'),
  ('00000000-0000-0000-0000-0000000000d3', 'mod-3@example.com', 'mod_reporter'),
  ('00000000-0000-0000-0000-0000000000e1', 'mod-x1@example.com', 'mod_x1'),
  ('00000000-0000-0000-0000-0000000000e2', 'mod-x2@example.com', 'mod_x2'),
  ('00000000-0000-0000-0000-0000000000e3', 'mod-x3@example.com', 'mod_x3'),
  ('00000000-0000-0000-0000-0000000000e4', 'mod-x4@example.com', 'mod_x4')
) as v(id, email, username);
update public.profiles set is_admin = true where id = '00000000-0000-0000-0000-0000000000d1';

insert into public.ratings (user_id, game_id, score, review) values
  ('00000000-0000-0000-0000-0000000000d2', 999300001, 10, 'Reseña ofensiva'),
  ('00000000-0000-0000-0000-0000000000e1', 999300001, 80, 'Buen juego'),
  ('00000000-0000-0000-0000-0000000000e2', 999300001, 82, null),
  ('00000000-0000-0000-0000-0000000000e3', 999300001, 84, null),
  ('00000000-0000-0000-0000-0000000000e4', 999300001, 86, null);
select set_config('test.review', (select id::text from public.ratings where user_id = '00000000-0000-0000-0000-0000000000d2'), true);
insert into public.review_likes (user_id, rating_id) values ('00000000-0000-0000-0000-0000000000d3', current_setting('test.review')::uuid);

do $$ begin
  assert (select valid_ratings_count from public.games where id = 999300001) = 5, 'preparacion: 5 votos validos';
end $$;

-- ------------------------------------------------------------ como m3 ---
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d3","role":"authenticated"}', true);

insert into public.reports (reporter_id, rating_id, reason, details)
values ('00000000-0000-0000-0000-0000000000d3', current_setting('test.review')::uuid, 'offensive', 'Insulta');

do $$ begin
  begin
    insert into public.reports (reporter_id, rating_id, reason) values ('00000000-0000-0000-0000-0000000000d3', current_setting('test.review')::uuid, 'spam');
    assert false, 'no puede reportar dos veces la misma reseña';
  exception when unique_violation then null; end;

  begin
    -- Reseña de x1 (que m3 todavía no reportó): solo falla por el motivo.
    insert into public.reports (reporter_id, rating_id, reason)
    values ('00000000-0000-0000-0000-0000000000d3', (select id from public.ratings where user_id = '00000000-0000-0000-0000-0000000000e1'), 'x');
    assert false, 'motivo invalido';
  exception when check_violation then null; end;

  assert (select count(*) from public.reports) = 1, 'un usuario solo ve sus reportes';

  begin
    perform public.moderate_rating(current_setting('test.review')::uuid, true);
    assert false, 'un usuario comun no puede ocultar reseñas';
  exception when others then assert sqlerrm = 'forbidden', 'moderate_rating: ' || sqlerrm; end;

  begin
    perform public.set_suspended('00000000-0000-0000-0000-0000000000d2', true);
    assert false, 'un usuario comun no puede suspender';
  exception when others then assert sqlerrm = 'forbidden', 'set_suspended: ' || sqlerrm; end;

  begin
    perform public.open_reports();
    assert false, 'un usuario comun no puede ver la cola de reportes';
  exception when others then assert sqlerrm = 'forbidden', 'open_reports: ' || sqlerrm; end;
end $$;

-- ------------------------------------------------------------ como m1 ---
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
do $$ begin
  assert (select count(*) from public.open_reports()) = 1, 'el admin ve 1 reporte abierto';
  assert (select author from public.open_reports() limit 1) = 'mod_author', 'el reporte muestra al autor';

  perform public.moderate_rating(current_setting('test.review')::uuid, true);
  assert (select status from public.reports limit 1) = 'resolved', 'ocultar cierra los reportes de esa reseña';

  perform public.set_suspended('00000000-0000-0000-0000-0000000000d2', true);
end $$;

reset role;
do $$ begin
  assert (select is_hidden from public.ratings where id = current_setting('test.review')::uuid), 'la reseña queda oculta';
  assert (select is_suspended from public.profiles where id = '00000000-0000-0000-0000-0000000000d2'), 'el autor queda suspendido';
  assert (select valid_ratings_count from public.games where id = 999300001) = 4, 'el voto del suspendido deja de contar';
  assert (select helpful_received from public.profiles where id = '00000000-0000-0000-0000-0000000000d2') = 1, 'preparacion: 1 like';
end $$;

-- Borrar la cuenta del reportero: sus likes se van en cascada y el autor los pierde.
delete from auth.users where id = '00000000-0000-0000-0000-0000000000d3';
do $$ begin
  assert (select helpful_received from public.profiles where id = '00000000-0000-0000-0000-0000000000d2') = 0,
    'borrar una cuenta descuenta los likes que dio';
end $$;

select 'moderation tests passed' as result;
rollback;

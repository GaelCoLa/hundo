-- =============================================================================
-- Datos de prueba de la comunidad, SOLO para la base de desarrollo (hundo-dev).
-- Crea 3 jugadores de prueba (sin contraseña: no se puede iniciar sesión con
-- ellos), reseñas de Hades, votos "útil" y seguimientos, para ver las páginas
-- con contenido. Se puede correr varias veces (borra y vuelve a crear).
--   npx supabase db query --remote --yes --file supabase/dev-seed-community.sql
-- NO correr contra producción.
-- =============================================================================
delete from auth.users where email like 'seed-%@example.com';

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
select ('00000000-0000-0000-0000-00000000de' || lpad(i::text, 2, '0'))::uuid,
       '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'seed-' || i || '@example.com', jsonb_build_object('username', (array['ana_plays','beto_rpg','cami_horror'])[i]),
       now(), now() - interval '10 days', now()
from generate_series(1, 3) as i;

insert into public.ratings (user_id, game_id, score, review, hours_played, finished_on) values
  ('00000000-0000-0000-0000-00000000de01', 113112, 96, 'El mejor roguelike que jugué. Cada muerte suma historia.', 60, '2025-03-10'),
  ('00000000-0000-0000-0000-00000000de02', 113112, 88, 'Muy bueno, aunque el final se hace repetitivo.', 35, '2025-06-01'),
  ('00000000-0000-0000-0000-00000000de03', 113112, 91, null, 42, null);

-- beto y cami marcan útil la reseña de ana; ana marca la de beto.
insert into public.review_likes (user_id, rating_id)
select u, (select id from public.ratings where user_id = '00000000-0000-0000-0000-00000000de01' and game_id = 113112)
from unnest(array['00000000-0000-0000-0000-00000000de02', '00000000-0000-0000-0000-00000000de03']::uuid[]) as u;
insert into public.review_likes (user_id, rating_id)
values ('00000000-0000-0000-0000-00000000de01', (select id from public.ratings where user_id = '00000000-0000-0000-0000-00000000de02' and game_id = 113112));

-- Para ver la insignia: ana figura con 50 "útil" (en desarrollo se ajusta a mano).
update public.profiles set helpful_received = 50 where id = '00000000-0000-0000-0000-00000000de01';

insert into public.follows (follower_id, followee_id) values
  ('00000000-0000-0000-0000-00000000de02', '00000000-0000-0000-0000-00000000de01'),
  ('00000000-0000-0000-0000-00000000de03', '00000000-0000-0000-0000-00000000de01');

select 'dev community seed done' as result;

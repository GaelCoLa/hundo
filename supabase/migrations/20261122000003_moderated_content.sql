-- =============================================================================
-- Arreglo de la revisión de la Fase 4: poder DESHACER una moderación.
-- Ocultar una reseña cierra sus reportes, y el panel solo listaba reportes
-- abiertos: una reseña oculta o una cuenta suspendida desaparecían del panel y
-- solo se podían restaurar con SQL. Esta función (solo admin) lista lo que está
-- moderado ahora mismo, para mostrarlo con "Mostrar reseña" / "Reactivar".
-- =============================================================================
create function public.moderated_content()
returns table (
  kind text,            -- 'review' (reseña oculta) o 'user' (cuenta suspendida)
  rating_id uuid,
  user_id uuid,
  username text,
  review text,
  score smallint,
  game_slug text,
  game_name text
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
  select 'review'::text, r.id, p.id, p.username, r.review, r.score, g.slug, g.name
  from public.ratings r
  join public.profiles p on p.id = r.user_id
  join public.games g on g.id = r.game_id
  where r.is_hidden
  union all
  select 'user'::text, null::uuid, p.id, p.username, null::text, null::smallint, null::text, null::text
  from public.profiles p
  where p.is_suspended
  order by 1, 4;
end;
$$;

revoke execute on function public.moderated_content() from public, anon;
grant execute on function public.moderated_content() to authenticated;

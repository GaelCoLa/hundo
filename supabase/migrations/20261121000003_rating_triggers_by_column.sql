-- =============================================================================
-- Arreglos de la revisión de la Fase 3.
--
-- 1) Un "útil" no es una edición de la reseña.
--    Al votar, la base hace UPDATE de ratings.helpful_count. Los triggers de
--    ratings estaban definidos para CUALQUIER update, así que cada "útil":
--      - cambiaba updated_at (la reseña saltaba a "Recientes" y al feed),
--      - contaba para el límite de 60 calificaciones por hora del AUTOR,
--      - recalculaba la nota del juego sin necesidad.
--    Ahora cada trigger dice qué columnas lo disparan ("update of ..."). Un
--    UPDATE que solo toca helpful_count ya no dispara ninguno.
--
-- 2) Si el autor borra el texto de su reseña, la reseña deja de existir para la
--    comunidad: sus "útil" se borran (y el trigger de review_likes descuenta los
--    contadores, así la insignia Top reviewer refleja solo reseñas reales).
-- =============================================================================

-- Antes de guardar (fecha de edición, fecha no futura, límite por hora):
-- solo cuando la persona edita su calificación.
drop trigger ratings_before_write on public.ratings;
create trigger ratings_before_write
  before insert or update of score, review, has_spoilers, hours_played, finished_on on public.ratings
  for each row execute function public.ratings_before_write();

-- Recalcular estadísticas del juego: solo si cambia algo que las afecta
-- (nota, reseña para reviews_count, horas para el promedio, ocultar, o mover la
-- calificación de usuario/juego).
drop trigger ratings_after_write on public.ratings;
create trigger ratings_after_write
  after insert or delete or update of score, review, hours_played, is_hidden, user_id, game_id on public.ratings
  for each row execute function public.ratings_after_write();

-- Reseña vaciada → se borran sus "útil".
create function public.ratings_review_cleared()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if nullif(trim(new.review), '') is null and nullif(trim(old.review), '') is not null then
    delete from public.review_likes where rating_id = new.id;
  end if;
  return null;
end;
$$;

create trigger ratings_review_cleared
  after update of review on public.ratings
  for each row execute function public.ratings_review_cleared();

revoke execute on function public.ratings_review_cleared() from public, anon, authenticated;

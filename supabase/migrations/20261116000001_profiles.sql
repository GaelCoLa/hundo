-- =============================================================================
-- Perfiles de usuario
--
-- Supabase guarda las cuentas (email, contraseña) en su propio esquema `auth`.
-- Nosotros guardamos los datos públicos del perfil en `public.profiles`,
-- con el mismo id que la cuenta.
-- =============================================================================

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text check (char_length(display_name) <= 40),
  avatar_url   text,
  bio          text check (char_length(bio) <= 300),
  locale       text not null default 'en' check (locale in ('en', 'es')),
  is_admin     boolean not null default false,
  is_suspended boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Único sin importar mayúsculas: "Gael" y "gael" no pueden coexistir.
create unique index profiles_username_lower_idx on public.profiles (lower(username));

-- -----------------------------------------------------------------------------
-- Crear el perfil automáticamente cuando alguien se registra.
-- El usuario elegido viaja en los metadatos del registro (options.data.username).
-- `security definer` = la función corre con permisos del dueño de la tabla,
-- porque en ese momento el usuario todavía no tiene sesión.
-- -----------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  wanted text := lower(trim(coalesce(new.raw_user_meta_data ->> 'username', '')));
begin
  -- Si no vino un usuario válido (p. ej. login con Google en el futuro),
  -- generamos uno provisorio que la persona puede cambiar después.
  if wanted !~ '^[a-z0-9_]{3,20}$' then
    wanted := 'player_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  insert into public.profiles (id, username) values (new.id, wanted);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS): la seguridad vive en la base de datos.
-- Aunque alguien manipule el código del navegador, Postgres solo deja hacer
-- lo que estas políticas permiten.
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Cualquiera (incluso sin sesión) puede ver perfiles no suspendidos;
-- cada uno siempre puede ver el suyo.
create policy "profiles are public unless suspended"
  on public.profiles for select
  using (is_suspended = false or id = (select auth.uid()));

-- Cada uno solo puede editar su propia fila...
create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ...y solo estas columnas. is_admin, is_suspended y created_at quedan
-- fuera del alcance de los usuarios: nadie puede hacerse admin a sí mismo.
revoke update on public.profiles from anon, authenticated;
grant update (username, display_name, avatar_url, bio, locale)
  on public.profiles to authenticated;

-- Nadie inserta ni borra perfiles a mano: los crea el trigger y se borran
-- en cascada al eliminar la cuenta.
revoke insert, delete on public.profiles from anon, authenticated;

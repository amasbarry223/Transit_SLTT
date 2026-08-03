-- Empêche l'escalade de privilèges : un utilisateur authentifié ne doit pas
-- pouvoir modifier role / permissions / actif sur sa propre ligne profiles
-- (la policy self-update n'avait aucun WITH CHECK sur ces colonnes).
-- Les administrateurs (is_admin) restent libres de les modifier.

create or replace function public.protect_profiles_sensitive_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return NEW;
  end if;

  if OLD.role is distinct from NEW.role
     or OLD.permissions is distinct from NEW.permissions
     or OLD.actif is distinct from NEW.actif then
    raise exception
      'Modification de role, permissions ou actif réservée aux administrateurs'
      using errcode = '42501';
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_protect_profiles_sensitive on public.profiles;
create trigger trg_protect_profiles_sensitive
  before update on public.profiles
  for each row
  execute function public.protect_profiles_sensitive_columns();

-- Défense en profondeur : resserrer la policy self-update
drop policy if exists "Mise à jour de son propre profil" on public.profiles;
drop policy if exists profiles_update_self on public.profiles;

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
    and permissions is not distinct from (
      select p.permissions from public.profiles p where p.id = auth.uid()
    )
    and actif = (select p.actif from public.profiles p where p.id = auth.uid())
  );

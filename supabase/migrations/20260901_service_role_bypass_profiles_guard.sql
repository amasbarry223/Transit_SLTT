-- BUG CRITIQUE : protect_profiles_sensitive_columns() (20260816) bloque
-- toute mise à jour de role/permissions/actif dès que la connexion n'est
-- pas un utilisateur authentifié dont le profil a role='Administrateur' —
-- y compris pour le client service_role. Or c'est exactement ce que font
-- POST /api/admin/users (création) et PATCH /api/admin/users/[id] (édition)
-- via createAdminClient() (service_role) : is_admin() y résout
-- systématiquement à false (auth.uid() est null sous service_role), donc
-- toute création/édition de compte avec un rôle non-Administrateur ou un
-- changement de permissions échoue silencieusement avec l'erreur 42501
-- "Modification de role, permissions ou actif réservée aux administrateurs"
-- — reproduit et confirmé en direct sur le projet avant ce correctif.
--
-- Le service_role bypasse déjà RLS par construction (c'est le rôle de
-- confiance du backend) ; cette garde métier doit donc s'effacer devant lui
-- exactement comme elle s'efface devant is_admin(), sans quoi elle
-- réintroduit une restriction que le modèle de sécurité Supabase ne prévoit
-- pas. `auth.role()` lit la claim `role` du JWT (distincte de `auth.uid()`,
-- qui reste null pour ce rôle) — c'est l'idiome standard Supabase pour ce
-- cas.

create or replace function public.protect_profiles_sensitive_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
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

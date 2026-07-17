-- Restreint la lecture de public.profiles (email + permissions de chaque
-- utilisateur, aujourd'hui lisibles par n'importe quel authentifié) à :
-- soi-même, et aux gestionnaires de comptes (utilisateurs:manage / admin).
-- Une vue publique sans colonnes sensibles reste ouverte à tous pour les
-- usages d'affichage (nom/rôle dans le tableau de bord, etc.).

drop policy if exists "Lecture des profils pour tous les authentifiés" on public.profiles;
create policy profiles_select_self_or_manager on public.profiles
  for select to authenticated
  using (
    auth.uid() = id
    or public.has_permission('utilisateurs:manage')
    or public.is_admin()
  );

create or replace view public.profiles_public as
  select id, nom, role, actif, derniere_connexion
  from public.profiles;

grant select on public.profiles_public to authenticated;

-- Suppression du rôle "Commercial" (acteur non nécessaire dans l'organisation
-- du client). Les comptes existants portant ce rôle sont réaffectés à
-- "Agent de transit" (rôle le plus proche : accès clients + devis) avant de
-- resserrer la contrainte, pour ne jamais laisser un profil avec un rôle
-- devenu invalide.
UPDATE public.profiles SET role = 'Agent de transit' WHERE role = 'Commercial';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('Administrateur', 'Agent de transit', 'Comptable', 'Magasinier'));

-- Nom légal complet pour l'en-tête des documents imprimés qui doivent
-- reproduire fidèlement le papier à en-tête officiel (ex. annuaire clients),
-- distinct du libellé court « SLTT » utilisé partout ailleurs dans l'app
-- (menus, badges, filtres — cf. 20260730_rename_societe_sltt.sql, un choix
-- produit délibéré qui reste inchangé). Nullable : repli sur `nom` si absent
-- (cf. societeToBrand côté app).
ALTER TABLE public.societes ADD COLUMN IF NOT EXISTS raison_sociale text;

UPDATE public.societes SET raison_sociale = 'Traoré de Logistique Transit-Transport'
  WHERE id = '22222222-2222-2222-2222-222222222222';

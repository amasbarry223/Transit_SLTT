-- Renomme la société "Traçabilité Emballage" en "Société d'Emballage"
-- (décision produit, aucun changement de comportement). Cible l'ID fixe
-- défini dans 20260713_societes.sql plutôt que l'ancien nom, pour rester
-- correcte même si la ligne a déjà été renommée manuellement entre-temps.
UPDATE public.societes
SET nom = 'Société d''Emballage'
WHERE id = '22222222-2222-2222-2222-222222222222';

-- F1 — Le logo Top Doumani est une bannière qui contient déjà son nom en
-- toutes lettres (contrairement au badge circulaire de Traoré Transit
-- Logistique, où le nom n'est pas lisible à la taille d'impression) :
-- répéter le nom en texte à côté du logo sur les documents imprimés est
-- redondant pour Top Doumani. Colonne par société plutôt que règle codée
-- en dur sur le nom, pour rester correcte si une société est renommée.
ALTER TABLE public.societes ADD COLUMN IF NOT EXISTS afficher_nom_avec_logo boolean NOT NULL DEFAULT true;

UPDATE public.societes SET afficher_nom_avec_logo = false
  WHERE id = '11111111-1111-1111-1111-111111111111';

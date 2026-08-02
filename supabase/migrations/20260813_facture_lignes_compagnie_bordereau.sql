-- F-ANNEXE — Colonnes additives pour coller au modèle de facture réel fourni
-- (Facture N°03, annexe Côte d'Ivoire) : compagnie maritime/aérienne et
-- bordereau de livraison par ligne. Nullables — non requis pour les lignes
-- de facture "génériques" existantes.
alter table public.facture_lignes add column if not exists compagnie text;
alter table public.facture_lignes add column if not exists bordereau_livraison text;

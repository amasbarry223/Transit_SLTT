-- F1 — Clarification des 2 sociétés réelles de la plateforme et de leur
-- identité légale (pour l'en-tête complet des bons de sortie imprimés) :
-- « Traçabilité Emballage » (renommée « Société d'Emballage » le 2026-07-16)
-- n'existait pas réellement — la 2e société est en fait « Traoré Transit
-- Logistique » (déjà la marque affichée sur le logo /logoV.png et sur
-- l'ancien en-tête fixe des bons de sortie de caisse). Rename ciblant l'ID
-- fixe pour rester correct même si le nom a déjà été changé manuellement.
UPDATE public.societes SET nom = 'Traoré Transit Logistique', logo_url = '/logoV.png'
  WHERE id = '22222222-2222-2222-2222-222222222222';

-- Coordonnées légales par société, affichées sur les bons de sortie
-- (adresse/téléphone/RCCM/NIF) — nullables : une société peut ne pas avoir
-- toutes ses coordonnées renseignées pour le moment.
ALTER TABLE public.societes ADD COLUMN IF NOT EXISTS adresse text;
ALTER TABLE public.societes ADD COLUMN IF NOT EXISTS telephone text;
ALTER TABLE public.societes ADD COLUMN IF NOT EXISTS rccm text;
ALTER TABLE public.societes ADD COLUMN IF NOT EXISTS nif text;

UPDATE public.societes SET
  adresse = 'Niaréla - Rue 516 porte C/63',
  telephone = '+223 76 96 47 06 / 92 92 46 48',
  rccm = 'Ma.Bko.2025 B.5897',
  nif = '084151062H'
  WHERE id = '22222222-2222-2222-2222-222222222222';

-- Top Doumani : seul le NIF est connu pour l'instant (082254575X) ;
-- adresse/téléphone/RCCM restent NULL jusqu'à ce qu'ils soient fournis.
UPDATE public.societes SET nif = '082254575X'
  WHERE id = '11111111-1111-1111-1111-111111111111';

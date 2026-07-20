-- Rend l'identité légale des sociétés éditable depuis l'app (retour audit
-- "données statiques") — jusqu'ici, adresse/téléphone/RCCM/NIF n'étaient
-- modifiables que par migration SQL. Ajoute les 2 noms de signataires
-- (jusqu'ici codés en dur dans le template du bon de sortie de caisse,
-- src/lib/export.ts) comme dernière donnée manquante pour rendre ce
-- document 100% piloté par la base.
ALTER TABLE public.societes ADD COLUMN IF NOT EXISTS signataire_dg text;
ALTER TABLE public.societes ADD COLUMN IF NOT EXISTS signataire_pdg text;

-- Seedées avec les valeurs actuellement codées en dur, pour que rien ne
-- change visuellement tant que personne ne les modifie depuis Paramètres.
UPDATE public.societes SET
  signataire_dg = 'Ali Badra TRAORE',
  signataire_pdg = 'Abdoul TRAORÉ'
  WHERE id = '22222222-2222-2222-2222-222222222222'
  AND signataire_dg IS NULL;

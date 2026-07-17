-- F1 — Logo par société (papier à en-tête distinct pour Top Doumani et
-- Société d'Emballage) + rattachement des bons de sortie de caisse à une
-- société (jusqu'ici décaissements non scopés, en-tête société mère fixe).

-- logo_url : chemin public (ex. /logo-TOP-DOUMANI.png) affiché sur les
-- documents imprimés de la société. NULL → repli sur le logo générique
-- de la plateforme (getLogoUrl()) tant que le fichier n'est pas fourni.
ALTER TABLE public.societes ADD COLUMN IF NOT EXISTS logo_url text;

UPDATE public.societes SET logo_url = '/logo-TOP-DOUMANI.png'
  WHERE id = '11111111-1111-1111-1111-111111111111';

-- bons_sortie_caisse : NOT NULL, défaut Top Doumani (même décision produit
-- que pour stock_items / mouvements / bons_sortie — aucune répartition
-- fiable rétroactive possible, réassignable ligne par ligne ensuite).
ALTER TABLE public.bons_sortie_caisse ADD COLUMN IF NOT EXISTS societe_id uuid
  REFERENCES public.societes(id) DEFAULT '11111111-1111-1111-1111-111111111111';
UPDATE public.bons_sortie_caisse SET societe_id = '11111111-1111-1111-1111-111111111111' WHERE societe_id IS NULL;
ALTER TABLE public.bons_sortie_caisse ALTER COLUMN societe_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bons_sortie_caisse_societe_id ON public.bons_sortie_caisse(societe_id);

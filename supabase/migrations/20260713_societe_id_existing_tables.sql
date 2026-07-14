-- F1 — Rattachement des tables entreposage existantes à une société.
-- Décision produit : aucune répartition fiable rétroactive possible → tout
-- l'historique est affecté à Top Doumani (1re société listée), réassignable
-- ligne par ligne depuis l'UI ensuite (Select société sur chaque ligne/fiche).

-- stock_items : NOT NULL, défaut Top Doumani
ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS societe_id uuid
  REFERENCES public.societes(id) DEFAULT '11111111-1111-1111-1111-111111111111';
UPDATE public.stock_items SET societe_id = '11111111-1111-1111-1111-111111111111' WHERE societe_id IS NULL;
ALTER TABLE public.stock_items ALTER COLUMN societe_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_items_societe_id ON public.stock_items(societe_id);

-- mouvements : NOT NULL, défaut Top Doumani
ALTER TABLE public.mouvements ADD COLUMN IF NOT EXISTS societe_id uuid
  REFERENCES public.societes(id) DEFAULT '11111111-1111-1111-1111-111111111111';
UPDATE public.mouvements SET societe_id = '11111111-1111-1111-1111-111111111111' WHERE societe_id IS NULL;
ALTER TABLE public.mouvements ALTER COLUMN societe_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mouvements_societe_id ON public.mouvements(societe_id);

-- bons_sortie : NOT NULL, défaut Top Doumani
ALTER TABLE public.bons_sortie ADD COLUMN IF NOT EXISTS societe_id uuid
  REFERENCES public.societes(id) DEFAULT '11111111-1111-1111-1111-111111111111';
UPDATE public.bons_sortie SET societe_id = '11111111-1111-1111-1111-111111111111' WHERE societe_id IS NULL;
ALTER TABLE public.bons_sortie ALTER COLUMN societe_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bons_sortie_societe_id ON public.bons_sortie(societe_id);

-- ecritures / factures : NULLABLE (peut rester au niveau transit global — cf. périmètre F1)
ALTER TABLE public.ecritures ADD COLUMN IF NOT EXISTS societe_id uuid REFERENCES public.societes(id);
CREATE INDEX IF NOT EXISTS idx_ecritures_societe_id ON public.ecritures(societe_id);

ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS societe_id uuid REFERENCES public.societes(id);
CREATE INDEX IF NOT EXISTS idx_factures_societe_id ON public.factures(societe_id);

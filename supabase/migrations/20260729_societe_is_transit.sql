-- Flag explicite pour la société porteuse du transit (remplace l'UUID hardcodé
-- dans le code et la vue classeur_mouvements).
ALTER TABLE public.societes ADD COLUMN IF NOT EXISTS is_transit boolean NOT NULL DEFAULT false;

UPDATE public.societes SET is_transit = true
WHERE id = '22222222-2222-2222-2222-222222222222';

CREATE UNIQUE INDEX IF NOT EXISTS idx_societes_single_transit
  ON public.societes ((true))
  WHERE is_transit = true;

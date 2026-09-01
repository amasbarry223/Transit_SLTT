-- Date de l'article de stock (ex. date de réception en magasin), distincte
-- de created_at (horodatage technique) : renseignée automatiquement à la
-- date du jour à la création, mais corrigeable ensuite via le modal
-- d'édition (utile pour un article saisi rétroactivement).
ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS date date not null default current_date;

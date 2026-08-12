-- Audit : addStockEntry()/addStockExit() (src/lib/store/stock-slice.ts)
-- calculaient la nouvelle quantité côté client à partir d'un snapshot
-- potentiellement obsolète (`stockItem.quantite + quantite`), puis
-- écrivaient cette valeur absolue. addStockEntry n'avait aucune garde ;
-- addStockExit avait un `.gte("quantite", quantite)` mais ce garde compare
-- la quantité retirée au stock courant, pas au stock lu au moment du calcul
-- — deux sorties concurrentes peuvent toutes deux passer la garde et la
-- seconde écrase le résultat correct de la première (perte de mise à jour).
--
-- Cette RPC applique le mouvement de façon atomique côté serveur
-- (`quantite = quantite + p_delta`, jamais un calcul client), verrouille la
-- ligne stock_items, revérifie l'accès annexe, et insère le mouvement dans
-- la même transaction — sur le modèle de record_ecriture_paiement /
-- validate_bon_sortie.

create or replace function public.apply_stock_movement(
  p_stock_id uuid,
  p_delta numeric,
  p_type text,
  p_responsable text,
  p_bon_ref text default null,
  p_motif text default null
)
returns table (
  stock_id uuid,
  stock_quantite numeric,
  mouvement_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.stock_items%rowtype;
  m public.mouvements%rowtype;
  v_resp text;
begin
  if not public.has_permission('stock:write') then
    raise exception 'Permission stock:write requise';
  end if;
  if p_type not in ('Entrée', 'Sortie') then
    raise exception 'Type de mouvement invalide: %', p_type;
  end if;
  if p_delta is null or p_delta = 0 then
    raise exception 'Quantité de mouvement invalide';
  end if;
  if (p_type = 'Entrée' and p_delta <= 0) or (p_type = 'Sortie' and p_delta >= 0) then
    raise exception 'Signe de la quantité incohérent avec le type de mouvement';
  end if;

  select * into s from public.stock_items where id = p_stock_id for update;
  if not found then
    raise exception 'Article de stock introuvable';
  end if;
  if not public.has_annexe_access(s.annexe_id) then
    raise exception 'Article de stock hors de votre périmètre d''annexe';
  end if;

  update public.stock_items
  set quantite = quantite + p_delta
  where id = p_stock_id and quantite + p_delta >= 0
  returning * into s;
  if not found then
    raise exception 'Stock insuffisant pour cette sortie';
  end if;

  v_resp := coalesce(nullif(p_responsable, ''), 'Système');

  insert into public.mouvements (
    stock_id, societe_id, annexe_id, type, quantite, date, responsable, marchandise, unite, bon_ref, motif
  ) values (
    s.id, s.societe_id, s.annexe_id, p_type, abs(p_delta), now(), v_resp, s.marchandise, s.unite, p_bon_ref, p_motif
  )
  returning * into m;

  return query select s.id, s.quantite, m.id;
end;
$$;

revoke all on function public.apply_stock_movement(uuid, numeric, text, text, text, text) from public;
grant execute on function public.apply_stock_movement(uuid, numeric, text, text, text, text) to authenticated;

-- Comble un deuxième trou du hardening RPC (20260804) : patchFactureMontantPaye
-- (édition directe de la cellule "montant payé" dans le Classeur / import Excel)
-- écrivait encore en direct sur factures sans verrou, en concurrence possible
-- avec le RPC atomique record_facture_paiement. Elle autorisait aussi à
-- rouvrir une facture "Soldée" (statut ramené à "Envoyée"), ce que le
-- commentaire de status-flow.ts dit explicitement avoir été proscrit après
-- l'audit du 16/07/2026 ("empêche de faire régresser un document déjà
-- soldé") — et que le trigger FSM assert_facture_transition (20260804)
-- rejette de toute façon (seule 'Soldée' → 'Annulée' est permise), donc ce
-- chemin finissait en exception Postgres brute plutôt qu'un message propre.

create or replace function public.patch_facture_montant_paye(
  p_facture_id uuid,
  p_montant_paye numeric
)
returns public.factures
language plpgsql
security definer
set search_path = public
as $$
declare
  f public.factures%rowtype;
  v_paye numeric;
  v_new_statut text;
begin
  if not public.has_permission('factures:write') then
    raise exception 'Permission factures:write requise';
  end if;
  if p_montant_paye is null then
    raise exception 'Montant invalide';
  end if;

  select * into f from public.factures where id = p_facture_id for update;
  if not found then
    raise exception 'Facture introuvable';
  end if;
  if f.statut in ('Brouillon', 'Annulée', 'Soldée') then
    raise exception 'Impossible de modifier le paiement d''une facture %', f.statut;
  end if;

  v_paye := greatest(0, least(coalesce(f.montant_ttc, 0), p_montant_paye));
  v_new_statut := case
    when v_paye >= coalesce(f.montant_ttc, 0) then 'Soldée'
    when v_paye > 0 then 'Partielle'
    else f.statut
  end;

  update public.factures
  set montant_paye = v_paye, statut = v_new_statut
  where id = p_facture_id
  returning * into f;

  return f;
end;
$$;

revoke all on function public.patch_facture_montant_paye(uuid, numeric) from public;
grant execute on function public.patch_facture_montant_paye(uuid, numeric) to authenticated;

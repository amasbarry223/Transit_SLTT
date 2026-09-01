-- Mono-société SLTT : retire Top Doumani, toutes les colonnes societe_id,
-- et le flag is_transit. public.societes reste comme singleton d'identité
-- légale (logo, RCCM, NIF, signataires). Les RPC / la vue classeur_mouvements
-- n'écrivent déjà plus societe_id côté base live.

delete from public.societes
where id = '11111111-1111-1111-1111-111111111111';

alter table public.archives drop column if exists societe_id;
alter table public.bons_sortie drop column if exists societe_id;
alter table public.bons_sortie_caisse drop column if exists societe_id;
alter table public.clients drop column if exists societe_id;
alter table public.clotures_caisse drop column if exists societe_id;
alter table public.contrats drop column if exists societe_id;
alter table public.depenses drop column if exists societe_id;
alter table public.devis drop column if exists societe_id;
alter table public.documents drop column if exists societe_id;
alter table public.dossiers drop column if exists societe_id;
alter table public.ecritures drop column if exists societe_id;
alter table public.excel_workbooks drop column if exists societe_id;
alter table public.factures drop column if exists societe_id;
alter table public.mouvements drop column if exists societe_id;
alter table public.operations_comptables drop column if exists societe_id;
alter table public.stock_items drop column if exists societe_id;

drop index if exists public.idx_societes_single_transit;
alter table public.societes drop column if exists is_transit;

create unique index if not exists idx_societes_singleton
  on public.societes ((true));

notify pgrst, 'reload schema';

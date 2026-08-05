-- Rattache les clients à une société (aligné dossiers/factures/devis).
-- Backfill vers la société transit (is_transit), sinon première société active.

alter table public.clients
  add column if not exists societe_id uuid references public.societes(id);

update public.clients
set societe_id = coalesce(
  (select id from public.societes where is_transit = true limit 1),
  (select id from public.societes where actif = true order by nom limit 1)
)
where societe_id is null;

-- Ne forcer NOT NULL que s'il n'existe plus de lignes orphelines.
do $$
begin
  if exists (select 1 from public.clients where societe_id is null) then
    raise notice 'clients.societe_id : des lignes restent null (pas de société en base) — NOT NULL non appliqué';
  else
    alter table public.clients alter column societe_id set not null;
  end if;
end $$;

create index if not exists idx_clients_societe_id on public.clients(societe_id);

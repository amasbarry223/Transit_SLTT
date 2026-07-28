-- Rattache les devis à une société (aligné dossiers/factures).
-- Backfill vers la société transit (is_transit), sinon première société active.

alter table public.devis
  add column if not exists societe_id uuid references public.societes(id);

update public.devis
set societe_id = coalesce(
  (select id from public.societes where is_transit = true limit 1),
  (select id from public.societes where actif = true order by nom limit 1)
)
where societe_id is null;

-- Ne forcer NOT NULL que s'il n'existe plus de lignes orphelines.
do $$
begin
  if exists (select 1 from public.devis where societe_id is null) then
    raise notice 'devis.societe_id : des lignes restent null (pas de société en base) — NOT NULL non appliqué';
  else
    alter table public.devis alter column societe_id set not null;
  end if;
end $$;

create index if not exists idx_devis_societe_id on public.devis(societe_id);

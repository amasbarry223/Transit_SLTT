-- Suivi Classeur §3.3 : lier chaque entrée d'audit à la source métier (dossier, écriture, facture).
alter table public.audit_logs
  add column if not exists source_type text,
  add column if not exists source_id uuid;

create index if not exists idx_audit_logs_source
  on public.audit_logs (source_type, source_id)
  where source_type is not null and source_id is not null;

create index if not exists idx_audit_logs_client_source
  on public.audit_logs (client_id, source_type, source_id)
  where client_id is not null;

-- Audit : audit_logs n'avait aucune colonne d'annexe/société. La permission
-- délégable audit:read (module "parametres") permettait donc à un
-- utilisateur non-admin, rattaché à une seule annexe, de lire le journal
-- d'audit de TOUTES les annexes/sociétés — fuite de confidentialité, et les
-- source_id exposés pouvaient être réutilisés pour exploiter l'absence de
-- has_annexe_access() dans les RPC financières (20260824).

alter table public.audit_logs
  add column if not exists annexe_id uuid references public.annexes(id);

-- Backfill best-effort depuis la source métier de chaque entrée, pour les
-- lignes déjà en base avant l'ajout de cette colonne.
update public.audit_logs al
set annexe_id = d.annexe_id
from public.dossiers d
where al.annexe_id is null and al.source_type = 'dossier' and al.source_id = d.id;

update public.audit_logs al
set annexe_id = e.annexe_id
from public.ecritures e
where al.annexe_id is null and al.source_type = 'ecriture' and al.source_id = e.id;

update public.audit_logs al
set annexe_id = f.annexe_id
from public.factures f
where al.annexe_id is null and al.source_type = 'facture' and al.source_id = f.id;

create index if not exists idx_audit_logs_annexe_id on public.audit_logs (annexe_id);

-- Les entrées sans annexe (Authentification, Utilisateurs, Sociétés,
-- Annexes, Système…) restent réservées aux admins : seule une entrée
-- explicitement rattachée à une annexe est visible via la permission
-- déléguée audit:read, et seulement pour les annexes de l'appelant.
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs for select to authenticated
  using (
    public.is_admin()
    or (public.has_permission('audit:read') and annexe_id is not null and public.has_annexe_access(annexe_id))
  );

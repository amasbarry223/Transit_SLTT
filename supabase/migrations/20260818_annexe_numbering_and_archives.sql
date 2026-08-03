-- F-ANNEXE (suite) — numérotation séparée par annexe (§3 cahier des charges) et
-- cloisonnement RLS des archives, qui était resté hors périmètre de
-- 20260810_annexe_id_existing_tables.sql (colonne annexe_id absente, RLS sans
-- has_annexe_access).

-- 1. Code court par annexe (ML/CI), utilisé comme préfixe de numérotation.
alter table public.annexes add column if not exists code text;
update public.annexes set code = 'ML' where id = '33333333-3333-3333-3333-333333333333';
update public.annexes set code = 'CI' where id = '44444444-4444-4444-4444-444444444444';
alter table public.annexes alter column code set not null;
create unique index if not exists idx_annexes_code on public.annexes (code);

-- 2. Cloisonnement archives par annexe — même pattern que 20260817 pour
-- contrats/devis/fournisseurs/transporteurs : backfill Mali (aucune activité
-- CI historique), NOT NULL, index, RLS avec has_annexe_access.
alter table public.archives add column if not exists annexe_id uuid references public.annexes(id)
  default '33333333-3333-3333-3333-333333333333';
update public.archives set annexe_id = '33333333-3333-3333-3333-333333333333' where annexe_id is null;
alter table public.archives alter column annexe_id set not null;
create index if not exists idx_archives_annexe_id on public.archives (annexe_id);

-- Conserver le split insert/delete de 20260717 (delete = admin-only) :
-- ne pas recréer archives_mutate FOR ALL.
drop policy if exists archives_select on public.archives;
drop policy if exists archives_insert on public.archives;
drop policy if exists archives_delete on public.archives;
drop policy if exists archives_mutate on public.archives;
create policy archives_select on public.archives for select to authenticated
  using (public.has_permission('archives:read') and public.has_annexe_access(annexe_id));
create policy archives_insert on public.archives for insert to authenticated
  with check (public.has_permission('archives:write') and public.has_annexe_access(annexe_id));
create policy archives_delete on public.archives for delete to authenticated
  using (public.is_admin() and public.has_annexe_access(annexe_id));

-- Storage : même règle sur les objets du bucket archives, pour empêcher la
-- résolution d'une URL signée sur un fichier hors annexe même si la ligne
-- `archives` correspondante n'est plus lisible.
drop policy if exists archives_storage_select on storage.objects;
create policy archives_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'archives'
    and public.has_permission('archives:read')
    and exists (
      select 1 from public.archives a
      where a.storage_path = storage.objects.name and public.has_annexe_access(a.annexe_id)
    )
  );

-- F-ANNEXE (suite) — cloisonnement RLS par annexe du module Documents/OCR.
-- 20260731_documents_ocr.sql n'avait posé qu'un contrôle par permission
-- (documents:read/write), sans annexe_id : un utilisateur mono-annexe pouvait
-- lire/télécharger les BL/DAU/factures scannés de l'AUTRE annexe (table
-- `documents`, ses tables filles OCR, et le bucket Storage `documents`) dès
-- lors qu'il avait la permission — même flux que "Nouveau dossier via OCR".
-- Même pattern que 20260818 (archives) : backfill Mali (aucune activité CI
-- historique), NOT NULL, index, RLS avec has_annexe_access ; les tables filles
-- sans colonne propre (document_versions, ocr_jobs, ocr_fields) héritent via
-- jointure jusqu'à `documents`.

alter table public.documents add column if not exists annexe_id uuid references public.annexes(id)
  default '33333333-3333-3333-3333-333333333333';
update public.documents set annexe_id = '33333333-3333-3333-3333-333333333333' where annexe_id is null;
alter table public.documents alter column annexe_id set not null;
create index if not exists idx_documents_annexe_id on public.documents (annexe_id);

drop policy if exists documents_select on public.documents;
drop policy if exists documents_mutate on public.documents;
create policy documents_select on public.documents for select to authenticated
  using (public.has_permission('documents:read') and public.has_annexe_access(annexe_id));
create policy documents_mutate on public.documents for all to authenticated
  using (public.has_permission('documents:write') and public.has_annexe_access(annexe_id))
  with check (public.has_permission('documents:write') and public.has_annexe_access(annexe_id));

-- document_versions : héritée du document parent.
drop policy if exists document_versions_select on public.document_versions;
drop policy if exists document_versions_mutate on public.document_versions;
create policy document_versions_select on public.document_versions for select to authenticated
  using (
    public.has_permission('documents:read')
    and exists (
      select 1 from public.documents d
      where d.id = document_versions.document_id and public.has_annexe_access(d.annexe_id)
    )
  );
create policy document_versions_mutate on public.document_versions for all to authenticated
  using (
    public.has_permission('documents:write')
    and exists (
      select 1 from public.documents d
      where d.id = document_versions.document_id and public.has_annexe_access(d.annexe_id)
    )
  )
  with check (
    public.has_permission('documents:write')
    and exists (
      select 1 from public.documents d
      where d.id = document_versions.document_id and public.has_annexe_access(d.annexe_id)
    )
  );

-- ocr_jobs : héritée du document parent.
drop policy if exists ocr_jobs_select on public.ocr_jobs;
drop policy if exists ocr_jobs_mutate on public.ocr_jobs;
create policy ocr_jobs_select on public.ocr_jobs for select to authenticated
  using (
    public.has_permission('documents:read')
    and exists (
      select 1 from public.documents d
      where d.id = ocr_jobs.document_id and public.has_annexe_access(d.annexe_id)
    )
  );
create policy ocr_jobs_mutate on public.ocr_jobs for all to authenticated
  using (
    public.has_permission('documents:write')
    and exists (
      select 1 from public.documents d
      where d.id = ocr_jobs.document_id and public.has_annexe_access(d.annexe_id)
    )
  )
  with check (
    public.has_permission('documents:write')
    and exists (
      select 1 from public.documents d
      where d.id = ocr_jobs.document_id and public.has_annexe_access(d.annexe_id)
    )
  );

-- ocr_fields : héritée via ocr_jobs -> documents.
drop policy if exists ocr_fields_select on public.ocr_fields;
drop policy if exists ocr_fields_mutate on public.ocr_fields;
create policy ocr_fields_select on public.ocr_fields for select to authenticated
  using (
    public.has_permission('documents:read')
    and exists (
      select 1 from public.ocr_jobs j
      join public.documents d on d.id = j.document_id
      where j.id = ocr_fields.ocr_job_id and public.has_annexe_access(d.annexe_id)
    )
  );
create policy ocr_fields_mutate on public.ocr_fields for all to authenticated
  using (
    public.has_permission('documents:write')
    and exists (
      select 1 from public.ocr_jobs j
      join public.documents d on d.id = j.document_id
      where j.id = ocr_fields.ocr_job_id and public.has_annexe_access(d.annexe_id)
    )
  )
  with check (
    public.has_permission('documents:write')
    and exists (
      select 1 from public.ocr_jobs j
      join public.documents d on d.id = j.document_id
      where j.id = ocr_fields.ocr_job_id and public.has_annexe_access(d.annexe_id)
    )
  );

-- Storage : même règle sur les objets du bucket `documents` (BL/DAU/factures
-- scannés), pour empêcher la résolution d'une URL signée hors annexe même si
-- la ligne `documents`/`document_versions` correspondante n'est plus lisible.
drop policy if exists documents_storage_select on storage.objects;
create policy documents_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and public.has_permission('documents:read')
    and exists (
      select 1 from public.document_versions v
      join public.documents d on d.id = v.document_id
      where v.storage_path = storage.objects.name and public.has_annexe_access(d.annexe_id)
    )
  );

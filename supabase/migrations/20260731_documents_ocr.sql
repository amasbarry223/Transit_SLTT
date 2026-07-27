-- Module Documents unifié : versions + OCR (bucket privé, signed URL).
-- Pattern calqué sur archives / contrat_fichiers. Les tables dossier_fichiers
-- et archives restent inchangées (coexistence v1).

-- ---------------------------------------------------------------------------
-- documents (entité logique, identité stable entre versions)
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  categorie text not null default 'Autre'
    check (categorie in ('BL','DAU','Facture','Reçu','SYDONIA','Contrat','Autre')),
  mime_type text not null,
  taille integer not null,
  dossier_id uuid references public.dossiers(id) on delete set null,
  facture_id uuid references public.factures(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  societe_id uuid references public.societes(id) on delete set null,
  entity_type text null
    check (entity_type is null or entity_type in ('dossier','facture','ecriture')),
  entity_id uuid null,
  current_version integer not null default 1,
  cree_par uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_documents_dossier_id on public.documents(dossier_id);
create index if not exists idx_documents_facture_id on public.documents(facture_id);
create index if not exists idx_documents_client_id on public.documents(client_id);
create index if not exists idx_documents_entity on public.documents(entity_type, entity_id)
  where entity_type is not null and entity_id is not null;

drop trigger if exists documents_updated_at on public.documents;
create trigger documents_updated_at
  before update on public.documents
  for each row execute procedure public.update_updated_at_column();

alter table public.documents enable row level security;
create policy documents_select on public.documents for select to authenticated
  using (public.has_permission('documents:read'));
create policy documents_mutate on public.documents for all to authenticated
  using (public.has_permission('documents:write'))
  with check (public.has_permission('documents:write'));

-- ---------------------------------------------------------------------------
-- document_versions (historique binaire)
-- ---------------------------------------------------------------------------
create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version integer not null,
  storage_path text not null,
  taille integer not null,
  mime_type text not null,
  checksum text null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (document_id, version)
);

create index if not exists idx_document_versions_document_id
  on public.document_versions(document_id);

alter table public.document_versions enable row level security;
create policy document_versions_select on public.document_versions for select to authenticated
  using (public.has_permission('documents:read'));
create policy document_versions_mutate on public.document_versions for all to authenticated
  using (public.has_permission('documents:write'))
  with check (public.has_permission('documents:write'));

-- ---------------------------------------------------------------------------
-- ocr_jobs
-- ---------------------------------------------------------------------------
create table if not exists public.ocr_jobs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  document_version_id uuid not null references public.document_versions(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','processing','done','failed','validated')),
  provider text not null default 'tesseract',
  raw_text text null,
  error_message text null,
  target_form text not null default 'dossier'
    check (target_form in ('dossier','facture','paiement')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz null
);

create index if not exists idx_ocr_jobs_document_id on public.ocr_jobs(document_id);
create index if not exists idx_ocr_jobs_status on public.ocr_jobs(status);

alter table public.ocr_jobs enable row level security;
create policy ocr_jobs_select on public.ocr_jobs for select to authenticated
  using (public.has_permission('documents:read'));
create policy ocr_jobs_mutate on public.ocr_jobs for all to authenticated
  using (public.has_permission('documents:write'))
  with check (public.has_permission('documents:write'));

-- ---------------------------------------------------------------------------
-- ocr_fields
-- ---------------------------------------------------------------------------
create table if not exists public.ocr_fields (
  id uuid primary key default gen_random_uuid(),
  ocr_job_id uuid not null references public.ocr_jobs(id) on delete cascade,
  field_key text not null,
  field_value text null,
  confidence numeric(4,3) null check (confidence is null or (confidence >= 0 and confidence <= 1)),
  bbox jsonb null,
  validated_value text null,
  unique (ocr_job_id, field_key)
);

create index if not exists idx_ocr_fields_job_id on public.ocr_fields(ocr_job_id);

alter table public.ocr_fields enable row level security;
create policy ocr_fields_select on public.ocr_fields for select to authenticated
  using (public.has_permission('documents:read'));
create policy ocr_fields_mutate on public.ocr_fields for all to authenticated
  using (public.has_permission('documents:write'))
  with check (public.has_permission('documents:write'));

-- ---------------------------------------------------------------------------
-- Bucket Storage privé
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  52428800,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/heic',
    'image/heif',
    'image/webp'
  ]
)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'documents_storage_select' and tablename = 'objects'
  ) then
    create policy documents_storage_select on storage.objects
      for select to authenticated
      using (bucket_id = 'documents' and public.has_permission('documents:read'));
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'documents_storage_insert' and tablename = 'objects'
  ) then
    create policy documents_storage_insert on storage.objects
      for insert to authenticated
      with check (bucket_id = 'documents' and public.has_permission('documents:write'));
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'documents_storage_update' and tablename = 'objects'
  ) then
    create policy documents_storage_update on storage.objects
      for update to authenticated
      using (bucket_id = 'documents' and public.has_permission('documents:write'))
      with check (bucket_id = 'documents' and public.has_permission('documents:write'));
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'documents_storage_delete' and tablename = 'objects'
  ) then
    create policy documents_storage_delete on storage.objects
      for delete to authenticated
      using (bucket_id = 'documents' and public.has_permission('documents:write'));
  end if;
end $$;

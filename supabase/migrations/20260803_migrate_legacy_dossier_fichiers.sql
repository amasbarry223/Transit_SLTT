-- Migration douce dossier_fichiers → documents (métadonnées).
-- Les binaires restent accessibles via data_url / bucket dossier-fichiers ;
-- le client résout les chemins `legacy/dossier_fichiers/{id}/…`.

insert into public.documents (
  id, nom, categorie, mime_type, taille, dossier_id, client_id,
  entity_type, entity_id, current_version, created_at, updated_at
)
select
  df.id,
  df.nom,
  'Autre',
  coalesce(nullif(split_part(df.type, ';', 1), ''), 'application/octet-stream'),
  coalesce(df.taille::integer, 0),
  df.dossier_id,
  d.client_id,
  'dossier',
  df.dossier_id,
  1,
  coalesce(df.date_upload, now()),
  coalesce(df.date_upload, now())
from public.dossier_fichiers df
left join public.dossiers d on d.id = df.dossier_id
where not exists (
  select 1 from public.documents doc where doc.id = df.id
)
on conflict (id) do nothing;

insert into public.document_versions (
  document_id, version, storage_path, taille, mime_type, created_at
)
select
  df.id,
  1,
  'legacy/dossier_fichiers/' || df.id || '/' || regexp_replace(df.nom, '[^\w.\-]+', '_', 'g'),
  coalesce(df.taille::integer, 0),
  coalesce(nullif(split_part(df.type, ';', 1), ''), 'application/octet-stream'),
  coalesce(df.date_upload, now())
from public.dossier_fichiers df
where exists (select 1 from public.documents doc where doc.id = df.id)
  and not exists (
    select 1 from public.document_versions dv
    where dv.document_id = df.id and dv.version = 1
  );

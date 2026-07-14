-- F3 — Archivage par scan : bucket privé dédié (dossier-fichiers est public,
-- inadapté aux documents contractuels sensibles).
create table if not exists public.contrat_fichiers (
    id uuid primary key default gen_random_uuid(),
    contrat_id uuid references public.contrats(id) on delete cascade not null,
    nom text not null,
    taille integer not null,
    type text not null,
    storage_path text not null, -- clé objet dans le bucket ; l'URL signée se génère à la demande côté client
    date_upload timestamptz not null default now(),
    created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_contrat_fichiers_contrat_id ON public.contrat_fichiers(contrat_id);

alter table public.contrat_fichiers enable row level security;
create policy contrat_fichiers_select on public.contrat_fichiers for select to authenticated
  using (public.has_permission('contrats:read'));
create policy contrat_fichiers_mutate on public.contrat_fichiers for all to authenticated
  using (public.has_permission('contrats:write')) with check (public.has_permission('contrats:write'));

-- Bucket Storage PRIVÉ pour les scans de contrats
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contrat-fichiers',
  'contrat-fichiers',
  false,
  52428800,
  ARRAY['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Policies Storage : réservées aux authentifiés disposant de la permission contrats,
-- AUCUNE policy SELECT publique/anon (contrairement à dossier-fichiers).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'contrat_fichiers_storage_select' AND tablename = 'objects'
  ) THEN
    CREATE POLICY contrat_fichiers_storage_select ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'contrat-fichiers' AND public.has_permission('contrats:read'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'contrat_fichiers_storage_insert' AND tablename = 'objects'
  ) THEN
    CREATE POLICY contrat_fichiers_storage_insert ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'contrat-fichiers' AND public.has_permission('contrats:write'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'contrat_fichiers_storage_delete' AND tablename = 'objects'
  ) THEN
    CREATE POLICY contrat_fichiers_storage_delete ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'contrat-fichiers' AND public.has_permission('contrats:write'));
  END IF;
END $$;

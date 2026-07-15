-- EVOL-7 — Module Archives : table unifiée + bucket Storage privé dédié.
-- Mirroring du pattern contrat_fichiers (bucket privé, storage_path, URL signée
-- à la demande côté client) — voir 20260713_contrat_fichiers.sql.
--
-- Rattachement optionnel à un dossier, une facture ou une dépense (ou "libre"
-- avec client_id/societe_id directs). Les fichiers déjà existants dans
-- dossier_fichiers et contrat_fichiers ne sont PAS dupliqués ici : ils restent
-- dans leurs tables/buckets d'origine et sont simplement affichés en lecture
-- seule dans l'écran Archives (agrégation côté client).
--
-- ⚠️ Risque résiduel documenté : le bucket `dossier-fichiers` (migration
-- 20260710_phase5_storage_indexes_security.sql) reste PUBLIC — hors périmètre
-- de ce ticket, l'écran Dossier n'est pas modifié. `contrat-fichiers` et
-- `archives` sont privés (accès authentifié + permission).
create table if not exists public.archives (
    id uuid primary key default gen_random_uuid(),
    nom text not null,
    type_document text not null default 'Autre'
      check (type_document in ('BL','DAU','Facture','Reçu','Contrat','Autre')),
    taille integer not null,
    mime_type text not null,
    storage_path text not null, -- clé objet dans le bucket ; l'URL signée se génère à la demande côté client
    dossier_id uuid references public.dossiers(id) on delete set null,
    facture_id uuid references public.factures(id) on delete set null,
    depense_id uuid references public.depenses(id) on delete set null,
    client_id uuid references public.clients(id) on delete set null,
    societe_id uuid references public.societes(id) on delete set null,
    cree_par text,
    created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_archives_dossier_id ON public.archives(dossier_id);
CREATE INDEX IF NOT EXISTS idx_archives_facture_id ON public.archives(facture_id);
CREATE INDEX IF NOT EXISTS idx_archives_depense_id ON public.archives(depense_id);
CREATE INDEX IF NOT EXISTS idx_archives_client_id ON public.archives(client_id);

alter table public.archives enable row level security;
create policy archives_select on public.archives for select to authenticated
  using (public.has_permission('archives:read'));
create policy archives_mutate on public.archives for all to authenticated
  using (public.has_permission('archives:write')) with check (public.has_permission('archives:write'));

-- Bucket Storage PRIVÉ dédié aux archives.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'archives',
  'archives',
  false,
  52428800,
  ARRAY['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Policies Storage : réservées aux authentifiés disposant de la permission archives,
-- AUCUNE policy SELECT publique/anon (mêmes garanties que contrat-fichiers).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'archives_storage_select' AND tablename = 'objects'
  ) THEN
    CREATE POLICY archives_storage_select ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'archives' AND public.has_permission('archives:read'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'archives_storage_insert' AND tablename = 'objects'
  ) THEN
    CREATE POLICY archives_storage_insert ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'archives' AND public.has_permission('archives:write'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'archives_storage_delete' AND tablename = 'objects'
  ) THEN
    CREATE POLICY archives_storage_delete ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'archives' AND public.has_permission('archives:write'));
  END IF;
END $$;

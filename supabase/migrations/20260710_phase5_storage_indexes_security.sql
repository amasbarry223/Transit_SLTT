-- Phase 5 : index FK, Storage dossiers, sécurité vues/RPC

-- Index sur les clés étrangères fréquemment filtrées
CREATE INDEX IF NOT EXISTS idx_dossiers_client_id ON dossiers(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_client_id ON factures(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_dossier_id ON factures(dossier_id);
CREATE INDEX IF NOT EXISTS idx_ecritures_client_id ON ecritures(client_id);
CREATE INDEX IF NOT EXISTS idx_ecritures_dossier_id ON ecritures(dossier_id);
CREATE INDEX IF NOT EXISTS idx_devis_client_id ON devis(client_id);
CREATE INDEX IF NOT EXISTS idx_dossier_fichiers_dossier_id ON dossier_fichiers(dossier_id);

-- Bucket Storage pour les fichiers dossier (remplace base64 volumineux)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dossier-fichiers',
  'dossier-fichiers',
  true,
  52428800,
  ARRAY['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- Policies Storage : lecture publique, écriture authentifiée
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'dossier_fichiers_select' AND tablename = 'objects'
  ) THEN
    CREATE POLICY dossier_fichiers_select ON storage.objects
      FOR SELECT USING (bucket_id = 'dossier-fichiers');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'dossier_fichiers_insert' AND tablename = 'objects'
  ) THEN
    CREATE POLICY dossier_fichiers_insert ON storage.objects
      FOR INSERT TO authenticated WITH CHECK (bucket_id = 'dossier-fichiers');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'dossier_fichiers_delete' AND tablename = 'objects'
  ) THEN
    CREATE POLICY dossier_fichiers_delete ON storage.objects
      FOR DELETE TO authenticated USING (bucket_id = 'dossier-fichiers');
  END IF;
END $$;

-- Vues en SECURITY INVOKER (advisors Supabase)
ALTER VIEW IF EXISTS v_clients_with_stats SET (security_invoker = true);
ALTER VIEW IF EXISTS v_fournisseurs_with_stats SET (security_invoker = true);

-- Révoquer l'exécution des RPC sensibles pour anon
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_permission(text) FROM anon;

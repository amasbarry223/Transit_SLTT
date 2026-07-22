-- Bucket Storage PUBLIC dédié aux logos de société (remplace le champ texte
-- "chemin public" qui obligeait à déposer le fichier manuellement dans
-- /public puis à en retaper le chemin — aucun moyen pour un admin non
-- développeur de changer un logo). Public : le logo est référencé depuis des
-- documents imprimés (fenêtres window.open, hors session applicative), donc
-- pas d'URL signée à renouveler, contrairement à archives/contrat-fichiers.
--
-- Le bucket lui-même a déjà été créé via l'API Storage (id, public, limites
-- de taille/type) ; cette migration ne fait qu'ajouter les policies RLS
-- manquantes sur storage.objects, absentes tant qu'elle n'est pas appliquée.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'societe-logos',
  'societe-logos',
  true,
  5242880,
  ARRAY['image/png','image/jpeg','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique (aucune permission requise) ; écriture réservée aux
-- utilisateurs authentifiés disposant de parametres:write — même garantie
-- que le formulaire Société lui-même (SocieteCard, parametres.tsx).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'societe_logos_storage_select' AND tablename = 'objects'
  ) THEN
    CREATE POLICY societe_logos_storage_select ON storage.objects
      FOR SELECT
      USING (bucket_id = 'societe-logos');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'societe_logos_storage_insert' AND tablename = 'objects'
  ) THEN
    CREATE POLICY societe_logos_storage_insert ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'societe-logos' AND public.has_permission('parametres:write'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'societe_logos_storage_update' AND tablename = 'objects'
  ) THEN
    CREATE POLICY societe_logos_storage_update ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'societe-logos' AND public.has_permission('parametres:write'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'societe_logos_storage_delete' AND tablename = 'objects'
  ) THEN
    CREATE POLICY societe_logos_storage_delete ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'societe-logos' AND public.has_permission('parametres:write'));
  END IF;
END $$;

-- Suivi structuré des mouvements par client (Classeur, section 3.3 du
-- retour client). La corrélation précédente (correspondance texte du nom
-- client dans `detail`) n'est pas fiable : un libellé qui ne répète pas le
-- nom exact du client passe entre les mailles. Colonne nullable — la
-- majorité des entrées d'audit (Authentification, Utilisateurs,
-- Transporteurs, Sociétés…) ne concernent aucun client.
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS client_id uuid
  REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_client_id ON public.audit_logs(client_id);

-- Realtime pour les nouvelles tables affichées / agrégées au dashboard
-- (contrat_fichiers volontairement exclu, comme dossier_fichiers aujourd'hui :
-- les tables de métadonnées de fichiers ne sont pas synchronisées en temps réel).
ALTER PUBLICATION supabase_realtime ADD TABLE societes;
ALTER PUBLICATION supabase_realtime ADD TABLE contrats;
ALTER PUBLICATION supabase_realtime ADD TABLE depenses;
ALTER PUBLICATION supabase_realtime ADD TABLE contrat_prestations;

-- Enable Supabase Realtime for dashboard-critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE dossiers;
ALTER PUBLICATION supabase_realtime ADD TABLE ecritures;
ALTER PUBLICATION supabase_realtime ADD TABLE factures;
ALTER PUBLICATION supabase_realtime ADD TABLE clients;
ALTER PUBLICATION supabase_realtime ADD TABLE stock_items;
ALTER PUBLICATION supabase_realtime ADD TABLE bons_sortie;
ALTER PUBLICATION supabase_realtime ADD TABLE devis;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

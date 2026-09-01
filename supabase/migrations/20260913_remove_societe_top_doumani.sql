-- Suppression définitive de la société "Top Doumani" et de tout ce qui lui
-- est rattaché — l'application redevient mono-société, centrée sur SLTT
-- (id '22222222-2222-2222-2222-222222222222'). Décision produit assumée :
-- Top Doumani a été la société par défaut de tout l'historique pré-multi-
-- société (cf. 20260713_societe_id_existing_tables.sql), donc certaines
-- lignes de bons_sortie / bons_sortie_caisse / ecritures / factures
-- supprimées ici pouvaient être d'anciennes données SLTT jamais réassignées
-- manuellement — risque accepté, aucune réassignation tentée.
--
-- Ordre des suppressions = enfants avant parents, pour respecter les FK qui
-- ne cascadent pas déjà automatiquement (contrat_prestations, depenses,
-- contrats). Les tables où societe_id est "on delete set null" (archives,
-- documents, excel_workbooks) ne sont volontairement pas vidées : ce sont
-- des documents génériques simplement tagués, pas des données "Top Doumani"
-- à proprement parler — leur societe_id repassera à NULL automatiquement
-- au DELETE FROM societes final.
--
-- Irréversible. Aucun rollback possible après exécution (hors sauvegarde).

do $$
declare
  v_societe_id uuid := '11111111-1111-1111-1111-111111111111'; -- Top Doumani
begin
  delete from public.clotures_caisse where societe_id = v_societe_id;
  delete from public.operations_comptables where societe_id = v_societe_id;

  -- contrat_prestations n'a pas de cascade propre sur contrat_id.
  delete from public.contrat_prestations
    where contrat_id in (select id from public.contrats where societe_id = v_societe_id);
  delete from public.depenses where societe_id = v_societe_id;
  delete from public.contrats where societe_id = v_societe_id;
  -- contrat_fichiers cascade automatiquement via contrat_id.

  -- mouvements cascade déjà via stock_id -> stock_items, mais on le fait
  -- explicitement en premier par sécurité (cohérence si un mouvement était
  -- tagué Top Doumani sur un article qui ne l'était pas).
  delete from public.mouvements where societe_id = v_societe_id;
  delete from public.stock_items where societe_id = v_societe_id;

  delete from public.bons_sortie where societe_id = v_societe_id;
  delete from public.bons_sortie_caisse where societe_id = v_societe_id;
  -- bons_sortie_caisse_lignes cascade automatiquement via bon_id.

  delete from public.ecritures where societe_id = v_societe_id;
  delete from public.factures where societe_id = v_societe_id;
  delete from public.devis where societe_id = v_societe_id;
  delete from public.dossiers where societe_id = v_societe_id;

  -- Dernier : cascade toute donnée client résiduelle (factures/dossiers/
  -- contrats/bons/devis non explicitement tagués Top Doumani mais rattachés
  -- à un client qui, lui, l'était).
  delete from public.clients where societe_id = v_societe_id;

  delete from public.societes where id = v_societe_id;
end $$;

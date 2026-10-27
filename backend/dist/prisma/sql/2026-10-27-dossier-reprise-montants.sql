-- =============================================================================
-- Transit SLTT — reprise des anciens montants des dossiers (27/10/2026)
--
-- @si-colonne: dossiers.valeur_douane
-- @si-colonne: dossiers.frais_circuit
-- @si-colonne: dossiers.montant_investi
-- (directives lues par apply-schema-scripts.ts : ce script n'est plus exécuté
--  une fois ces colonnes supprimées par prisma/sql-manuel/2026-10-27-phase2-…)
--
--   * sauvegarde des anciens montants dans dossiers_montants_sauvegarde_20261027
--   * reprise sans perte de chaque dossier existant :
--       valeur_douane > 0 → dépense "Droit de douane" (DOUANE)
--       frais_circuit > 0 → dépense "Frais de circuit (reprise)" (DIVERS)
--       montant_paye  > 0 → paiement "Paiement (reprise)"
--   * les colonnes reprises sont ensuite vidées : leurs valeurs vivent dans
--     les lignes (et dans la sauvegarde), la reprise ne se redéclenche donc
--     jamais, même si l'utilisateur supprime ensuite toutes les lignes.
--
-- Rejoué à chaque démarrage tant que les colonnes existent : idempotent.
-- =============================================================================

CREATE TABLE IF NOT EXISTS `dossiers_montants_sauvegarde_20261027` AS
SELECT `id`, `valeur_douane`, `frais_circuit`, `frais_prestation`, `montant_investi`, `montant_paye`, `date_solde`
FROM `dossiers`;

-- Douane et circuit en une seule instruction : le NOT EXISTS est évalué avant
-- l'insertion, un dossier reçoit donc ses deux lignes ou aucune.
INSERT INTO `dossier_depenses` (`id`, `dossier_id`, `date`, `nature`, `categorie`, `montant`, `created_at`, `updated_at`)
SELECT UUID(), src.`dossier_id`, src.`date`, src.`nature`, src.`categorie`, src.`montant`, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM (
    SELECT d.`id` AS `dossier_id`, d.`created_at` AS `date`, 'Droit de douane' AS `nature`, 'DOUANE' AS `categorie`, ROUND(d.`valeur_douane`) AS `montant`
    FROM `dossiers` d WHERE d.`valeur_douane` > 0
    UNION ALL
    SELECT d.`id`, d.`created_at`, 'Frais de circuit (reprise)', 'DIVERS', ROUND(d.`frais_circuit`)
    FROM `dossiers` d WHERE d.`frais_circuit` > 0
) src
WHERE NOT EXISTS (SELECT 1 FROM `dossier_depenses` x WHERE x.`dossier_id` = src.`dossier_id`);

INSERT INTO `dossier_paiements` (`id`, `dossier_id`, `date`, `montant`, `mode`, `reference`, `created_at`, `updated_at`)
SELECT UUID(), d.`id`, IFNULL(d.`date_solde`, d.`created_at`), ROUND(d.`montant_paye`), 'ESPECES', 'Paiement (reprise)', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `dossiers` d
WHERE d.`montant_paye` > 0
  AND NOT EXISTS (SELECT 1 FROM `dossier_paiements` p WHERE p.`dossier_id` = d.`id`);

UPDATE `dossiers`
SET `valeur_douane` = NULL, `frais_circuit` = 0, `montant_investi` = 0
WHERE `valeur_douane` IS NOT NULL OR `frais_circuit` <> 0 OR `montant_investi` <> 0;

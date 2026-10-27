-- =============================================================================
-- Transit SLTT — dossiers au format "Situation du client" (27/10/2026)
--   Total contrat, paiements du client, dépenses (droit de douane compris),
--   bénéfice net = total contrat − Σ dépenses.
--
--   * sauvegarde des anciens montants dans dossiers_montants_sauvegarde_20261027
--   * table `dossier_depenses`  : dépenses du dossier (BIGINT, FCFA entiers)
--   * table `dossier_paiements` : paiements reçus du client (BIGINT)
--   * reprise sans perte de chaque dossier existant :
--       valeur_douane > 0 → dépense "Droit de douane" (DOUANE)
--       frais_circuit > 0 → dépense "Frais de circuit (reprise)" (DIVERS)
--       montant_paye  > 0 → paiement "Paiement (reprise)"
--   * les colonnes valeur_douane / frais_circuit / montant_investi sont ensuite
--     vidées : leurs valeurs vivent dans les lignes (et dans la sauvegarde).
--
-- Rejoué à chaque démarrage du backend (apply-schema-scripts.ts) : chaque
-- instruction est idempotente. Après la première exécution, les colonnes
-- reprises valent 0/NULL, la reprise ne se redéclenche donc jamais, même si
-- l'utilisateur supprime ensuite toutes les lignes d'un dossier.
--
-- La suppression physique des anciennes colonnes et le renommage
-- frais_prestation → total_contrat sont faits à la main, plus tard :
-- prisma/sql-manuel/2026-10-27-phase2-colonnes-dossier.sql.
-- DDL généré par `prisma migrate diff` depuis backend/prisma/schema.prisma.
-- =============================================================================

CREATE TABLE IF NOT EXISTS `dossiers_montants_sauvegarde_20261027` AS
SELECT `id`, `valeur_douane`, `frais_circuit`, `frais_prestation`, `montant_investi`, `montant_paye`, `date_solde`
FROM `dossiers`;

CREATE TABLE IF NOT EXISTS `dossier_depenses` (
    `id` VARCHAR(191) NOT NULL,
    `dossier_id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `nature` VARCHAR(191) NOT NULL,
    `categorie` VARCHAR(191) NOT NULL DEFAULT 'DIVERS',
    `montant` BIGINT NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `dossier_depenses_dossier_id_idx`(`dossier_id`),
    PRIMARY KEY (`id`),
    CONSTRAINT `dossier_depenses_dossier_id_fkey` FOREIGN KEY (`dossier_id`) REFERENCES `dossiers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `dossier_paiements` (
    `id` VARCHAR(191) NOT NULL,
    `dossier_id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `montant` BIGINT NOT NULL DEFAULT 0,
    `mode` VARCHAR(191) NOT NULL DEFAULT 'ESPECES',
    `reference` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `dossier_paiements_dossier_id_idx`(`dossier_id`),
    PRIMARY KEY (`id`),
    CONSTRAINT `dossier_paiements_dossier_id_fkey` FOREIGN KEY (`dossier_id`) REFERENCES `dossiers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- =============================================================================
-- Transit SLTT — dossiers au format "Situation du client" (27/10/2026)
--   Total contrat, paiements du client, dépenses (droit de douane compris),
--   bénéfice net = total contrat − Σ dépenses.
--
--   * table `dossier_depenses`  : dépenses du dossier (BIGINT, FCFA entiers)
--   * table `dossier_paiements` : paiements reçus du client (BIGINT)
--
-- La reprise des anciens montants est dans 2026-10-27-dossier-reprise-montants.sql
-- (exécuté juste après, tant que les anciennes colonnes existent).
-- Rejoué à chaque démarrage du backend (apply-schema-scripts.ts) : idempotent.
-- DDL généré par `prisma migrate diff` depuis backend/prisma/schema.prisma.
-- =============================================================================

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

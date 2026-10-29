-- =============================================================================
-- Transit SLTT — prestations de contrat persistées (30/10/2026)
--   Jusqu'ici les prestations d'un contrat n'existaient que dans le navigateur
--   (contrats-slice.ts) et disparaissaient au rechargement.
-- Rejoué à chaque démarrage du backend (apply-schema-scripts.ts) : idempotent.
-- =============================================================================

CREATE TABLE IF NOT EXISTS `contrat_prestations` (
    `id` VARCHAR(191) NOT NULL,
    `contrat_id` VARCHAR(191) NOT NULL,
    `libelle` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `montant` DOUBLE NULL,
    `statut` VARCHAR(191) NOT NULL DEFAULT 'Prévue',
    `date_prevue` VARCHAR(191) NULL,
    `date_realisation` VARCHAR(191) NULL,
    `facturee` BOOLEAN NOT NULL DEFAULT false,
    `cree_par` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `contrat_prestations_contrat_id_idx`(`contrat_id`),
    PRIMARY KEY (`id`),
    CONSTRAINT `contrat_prestations_contrat_id_fkey` FOREIGN KEY (`contrat_id`) REFERENCES `contrats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

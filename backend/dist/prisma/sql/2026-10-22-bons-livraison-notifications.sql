-- =============================================================================
-- Transit SLTT — mise à jour du schéma MySQL de production (22/10/2026)
--   * nouvelle table `bons_livraison` (bons de livraison générés depuis un
--     bon de sortie validé)
--   * table `notifications` (déjà décrite dans schema.prisma, créée ici
--     seulement si elle n'a jamais été poussée en production)
--
-- À exécuter dans phpMyAdmin (onglet SQL) sur la base de production AVANT de
-- déployer le backend. Ré-exécutable sans danger : IF NOT EXISTS partout.
-- DDL généré par `prisma migrate diff` depuis backend/prisma/schema.prisma,
-- contraintes de clé étrangère regroupées dans le CREATE TABLE pour rester
-- idempotent.
-- =============================================================================

CREATE TABLE IF NOT EXISTS `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `titre` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `lue` BOOLEAN NOT NULL DEFAULT false,
    `lien` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bons_livraison` (
    `id` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `bon_sortie_id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `client_nom` VARCHAR(191) NOT NULL,
    `annexe_id` VARCHAR(191) NOT NULL,
    `lignes` JSON NOT NULL,
    `transporteur_id` VARCHAR(191) NULL,
    `transporteur_nom` VARCHAR(191) NULL,
    `immatriculation` VARCHAR(191) NULL,
    `chauffeur_nom` VARCHAR(191) NULL,
    `chauffeur_telephone` VARCHAR(191) NULL,
    `adresse_livraison` VARCHAR(191) NULL,
    `observations` TEXT NULL,
    `statut` VARCHAR(191) NOT NULL DEFAULT 'En cours',
    `cree_par` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bons_livraison_reference_key`(`reference`),
    UNIQUE INDEX `bons_livraison_bon_sortie_id_key`(`bon_sortie_id`),
    INDEX `bons_livraison_client_id_idx`(`client_id`),
    INDEX `bons_livraison_annexe_id_idx`(`annexe_id`),
    INDEX `bons_livraison_transporteur_id_idx`(`transporteur_id`),
    PRIMARY KEY (`id`),

    CONSTRAINT `bons_livraison_bon_sortie_id_fkey` FOREIGN KEY (`bon_sortie_id`) REFERENCES `bons_sortie`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `bons_livraison_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `bons_livraison_annexe_id_fkey` FOREIGN KEY (`annexe_id`) REFERENCES `annexes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `bons_livraison_transporteur_id_fkey` FOREIGN KEY (`transporteur_id`) REFERENCES `transporteurs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

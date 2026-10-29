-- =============================================================================
-- Transit SLTT — journal comptable alimenté automatiquement (29/10/2026)
--   Table de liaison entre une écriture du journal (operations_comptables) et
--   l'événement métier qui l'a générée (règlement / dépense de dossier,
--   encaissement de facture, paiement de dépense). La contrainte unique
--   (origine_type, origine_id) garantit qu'un événement n'est journalisé
--   qu'une fois.
-- Rejoué à chaque démarrage du backend (apply-schema-scripts.ts) : idempotent.
-- Aucune donnée existante n'est modifiée : seuls les NOUVEAUX événements
-- (postérieurs à la date de bascule, cf. journal-posting.ts) sont journalisés.
-- =============================================================================

CREATE TABLE IF NOT EXISTS `journal_liens` (
    `id` VARCHAR(191) NOT NULL,
    `origine_type` VARCHAR(191) NOT NULL,
    `origine_id` VARCHAR(191) NOT NULL,
    `operation_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `journal_liens_operation_id_key`(`operation_id`),
    UNIQUE INDEX `journal_liens_origine_type_origine_id_key`(`origine_type`, `origine_id`),
    PRIMARY KEY (`id`),
    CONSTRAINT `journal_liens_operation_id_fkey` FOREIGN KEY (`operation_id`) REFERENCES `operations_comptables`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

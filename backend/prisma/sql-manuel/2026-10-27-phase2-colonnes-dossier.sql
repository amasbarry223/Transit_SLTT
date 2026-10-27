-- =============================================================================
-- Transit SLTT — PHASE 2 (MANUELLE) de la refonte "Situation du client"
--
-- NE PAS placer ce fichier dans prisma/sql/ : il n'est PAS idempotent et ne
-- doit être exécuté qu'UNE fois, à la main (phpMyAdmin, onglet SQL).
--
-- Prérequis :
--   1. La phase 1 (prisma/sql/2026-10-27-dossier-depenses-paiements.sql) a
--      tourné en production (tables dossier_depenses / dossier_paiements
--      remplies, colonnes ci-dessous à 0/NULL).
--   2. Les chiffres ont été vérifiés dans l'application (liste des dossiers,
--      situation client, tableau de bord).
--   3. Une sauvegarde de la base a été faite.
--
-- Déploiement à faire EN MÊME TEMPS que ce script (sinon le backend ne trouve
-- plus la colonne frais_prestation) :
--   backend/prisma/schema.prisma, modèle Dossier :
--     totalContrat Float @default(0) @map("frais_prestation")
--   devient
--     totalContrat Float @default(0) @map("total_contrat")
--   puis `npm run build` dans backend/ et commit de backend/dist.
--   Ordre conseillé : exécuter ce script, puis redémarrer le backend déployé
--   avec la nouvelle version.
-- =============================================================================

-- Contrôle : doit renvoyer 0 avant de continuer.
SELECT COUNT(*) AS montants_non_repris
FROM `dossiers`
WHERE `valeur_douane` IS NOT NULL OR `frais_circuit` <> 0 OR `montant_investi` <> 0;

ALTER TABLE `dossiers`
    DROP COLUMN `valeur_douane`,
    DROP COLUMN `frais_circuit`,
    DROP COLUMN `montant_investi`,
    CHANGE COLUMN `frais_prestation` `total_contrat` DOUBLE NOT NULL DEFAULT 0;

-- Une fois tout validé (quelques semaines plus tard), la sauvegarde peut partir :
-- DROP TABLE `dossiers_montants_sauvegarde_20261027`;

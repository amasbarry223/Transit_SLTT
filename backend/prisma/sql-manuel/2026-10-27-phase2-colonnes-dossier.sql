-- =============================================================================
-- Transit SLTT — PHASE 2 (MANUELLE) de la refonte "Situation du client"
--
-- NE PAS placer ce fichier dans prisma/sql/ : il n'est PAS idempotent et ne
-- doit être exécuté qu'UNE fois, à la main (phpMyAdmin, onglet SQL).
--
-- Prérequis :
--   1. La version du 27/10/2026 est déployée et a démarré au moins une fois
--      (phase 1 : tables dossier_depenses / dossier_paiements remplies,
--      colonnes ci-dessous à 0/NULL).
--   2. Les chiffres ont été vérifiés dans l'application (liste des dossiers,
--      situation client, tableau de bord).
--   3. Une sauvegarde de la base a été faite (phpMyAdmin > Exporter).
--
-- Aucun déploiement n'est nécessaire : le code ne lit plus ces colonnes.
-- =============================================================================

-- Étape 1 — contrôle : doit renvoyer 0. Sinon NE PAS continuer (le backend
-- n'a pas encore démarré avec la nouvelle version).
SELECT COUNT(*) AS montants_non_repris
FROM `dossiers`
WHERE `valeur_douane` IS NOT NULL OR `frais_circuit` <> 0 OR `montant_investi` <> 0;

-- Étape 2 — suppression des anciennes colonnes (leurs valeurs restent dans
-- dossiers_montants_sauvegarde_20261027).
ALTER TABLE `dossiers`
    DROP COLUMN `valeur_douane`,
    DROP COLUMN `frais_circuit`,
    DROP COLUMN `montant_investi`;

-- -----------------------------------------------------------------------------
-- OPTIONNEL — renommer frais_prestation en total_contrat (purement cosmétique,
-- le code l'appelle déjà totalContrat). À faire UNIQUEMENT en même temps qu'un
-- déploiement où backend/prisma/schema.prisma passe de
--   @map("frais_prestation")  à  @map("total_contrat")
-- (puis npm run build + commit de backend/dist), sinon le backend plante.
--
-- ALTER TABLE `dossiers` CHANGE COLUMN `frais_prestation` `total_contrat` DOUBLE NOT NULL DEFAULT 0;
-- -----------------------------------------------------------------------------

-- Plus tard, quand tout est validé (quelques semaines), la sauvegarde peut partir :
-- DROP TABLE `dossiers_montants_sauvegarde_20261027`;

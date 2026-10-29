-- =============================================================================
-- Transit SLTT — le DOSSIER fait foi pour l'encaissé (30/10/2026)
--
-- Désormais, un encaissement sur une facture liée à un dossier crée un
-- règlement du dossier (factures.service.ts → enregistrerPaiement). Ce script
-- reprend UNE SEULE FOIS l'historique : pour chaque dossier dont les factures
-- liées (non annulées) ont encaissé plus que les règlements déjà saisis sur le
-- dossier, la DIFFÉRENCE est ajoutée en un règlement « Reprise encaissements
-- factures ». Prendre la différence (et non la somme) évite de compter deux
-- fois un même versement saisi à la fois sur le dossier et sur sa facture.
--
-- Rejoué à chaque démarrage (apply-schema-scripts.ts) mais n'agit qu'une fois :
-- chaque instruction est conditionnée à l'absence du marqueur
-- `reprise.encaissements_factures_20261030` dans `settings`, posé en dernier.
-- created_at = date de la facture (passée) : la reprise n'est pas journalisée
-- automatiquement (seules les lignes postérieures à la bascule le sont).
-- =============================================================================

INSERT INTO `dossier_paiements` (`id`, `dossier_id`, `date`, `montant`, `mode`, `reference`, `created_at`, `updated_at`)
SELECT UUID(), f.`dossier_id`, MAX(f.`date_emission`),
       ROUND(SUM(f.`montant_paye`)) - COALESCE(p.`total`, 0),
       'ESPECES', 'Reprise encaissements factures', MAX(f.`date_emission`), CURRENT_TIMESTAMP(3)
FROM `factures` f
JOIN `dossiers` d ON d.`id` = f.`dossier_id`
LEFT JOIN (
    SELECT `dossier_id`, SUM(`montant`) AS `total` FROM `dossier_paiements` GROUP BY `dossier_id`
) p ON p.`dossier_id` = f.`dossier_id`
WHERE f.`dossier_id` IS NOT NULL
  AND f.`statut` <> 'ANNULEE'
  AND NOT EXISTS (SELECT 1 FROM `settings` s WHERE s.`cle` = 'reprise.encaissements_factures_20261030')
GROUP BY f.`dossier_id`, p.`total`
HAVING ROUND(SUM(f.`montant_paye`)) - COALESCE(p.`total`, 0) > 0;

-- Recalcul du cache montant_paye / date_solde des dossiers (Σ règlements).
UPDATE `dossiers` d
JOIN (
    SELECT `dossier_id`, SUM(`montant`) AS `total`, MAX(`date`) AS `dernier` FROM `dossier_paiements` GROUP BY `dossier_id`
) p ON p.`dossier_id` = d.`id`
SET d.`montant_paye` = p.`total`, d.`date_solde` = p.`dernier`
WHERE NOT EXISTS (SELECT 1 FROM `settings` s WHERE s.`cle` = 'reprise.encaissements_factures_20261030');

INSERT INTO `settings` (`id`, `cle`, `valeur`, `type`, `description`, `is_public`, `group_name`, `updated_at`)
SELECT UUID(), 'reprise.encaissements_factures_20261030', 'fait', 'string',
       'Reprise unique des encaissements de factures liées vers les règlements de dossier.', 0, 'comptabilite', CURRENT_TIMESTAMP(3)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `settings` s WHERE s.`cle` = 'reprise.encaissements_factures_20261030');

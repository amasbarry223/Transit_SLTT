-- =============================================================================
-- Transit SLTT — pays des clients (30/10/2026)
--   La création d'un client enregistrait « Guinée » par défaut (valeur héritée
--   d'un modèle de départ) : les 21 clients existants sont en Guinée alors que
--   l'entreprise opère au Mali et en Côte d'Ivoire. Reprise UNIQUE : pays du
--   client = pays de son annexe ; sans annexe, pays vidé.
-- Rejoué à chaque démarrage (apply-schema-scripts.ts) mais n'agit qu'une fois
-- (marqueur `reprise.pays_clients_20261030` dans settings, posé en dernier) :
-- un vrai client guinéen saisi plus tard ne sera jamais modifié.
-- =============================================================================

UPDATE `clients` c
LEFT JOIN `annexes` a ON a.`id` = c.`annexe_id`
SET c.`pays` = a.`pays`
WHERE c.`pays` = 'Guinée'
  AND NOT EXISTS (SELECT 1 FROM `settings` s WHERE s.`cle` = 'reprise.pays_clients_20261030');

INSERT INTO `settings` (`id`, `cle`, `valeur`, `type`, `description`, `is_public`, `group_name`, `updated_at`)
SELECT UUID(), 'reprise.pays_clients_20261030', 'fait', 'string',
       'Reprise unique du pays des clients (Guinée par défaut remplacé par le pays de l''annexe).', 0, 'clients', CURRENT_TIMESTAMP(3)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `settings` s WHERE s.`cle` = 'reprise.pays_clients_20261030');

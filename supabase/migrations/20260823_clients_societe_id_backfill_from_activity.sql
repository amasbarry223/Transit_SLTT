-- Corrige le backfill de 20260820_clients_societe_id.sql : les clients
-- pré-existants avaient TOUS été rattachés à une société unique par défaut
-- (société transit, sinon 1re société active), indépendamment de la société
-- réellement associée à leurs dossiers/devis/factures/écritures déjà en
-- base — alors que societe_id sert de filtre actif en UI (liste clients,
-- badge société).
--
-- On recalcule ici societe_id à partir de la société la plus fréquente
-- parmi les enregistrements réellement liés au client (dossiers, devis,
-- factures, écritures), quand elle diffère de la valeur actuelle. bons_sortie
-- / stock_items / mouvements sont volontairement exclus : leur propre
-- societe_id historique a été affecté au même type de défaut arbitraire
-- (cf. 20260713_societe_id_existing_tables.sql), ce ne serait pas une source
-- fiable. Les clients sans aucun enregistrement lié restent inchangés — pas
-- d'information disponible pour faire mieux qu'un réassignement manuel via
-- l'UI (Fiche client > Société).

with client_societe_votes as (
  select client_id, societe_id, count(*) as n
  from (
    select client_id, societe_id from public.dossiers where societe_id is not null
    union all
    select client_id, societe_id from public.devis where societe_id is not null
    union all
    select client_id, societe_id from public.factures where societe_id is not null
    union all
    select client_id, societe_id from public.ecritures where societe_id is not null
  ) linked
  group by client_id, societe_id
),
best_societe as (
  select distinct on (client_id) client_id, societe_id
  from client_societe_votes
  order by client_id, n desc, societe_id
)
update public.clients c
set societe_id = best_societe.societe_id
from best_societe
where c.id = best_societe.client_id
  and best_societe.societe_id is distinct from c.societe_id;

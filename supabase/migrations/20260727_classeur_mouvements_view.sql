-- Classeur client (retour client V1, section 4) — vue SQL unifiée des
-- mouvements, en remplacement de la construction 100% côté client dans
-- src/lib/classeur.ts. Mêmes règles métier que buildClasseurJournal() :
--   - dossiers : toujours rattachés à SLTT (Traoré Transit Logistique),
--     ID fixe défini dans 20260713_societes.sql — les dossiers n'ont pas
--     de societe_id en base, le transit est exclusivement porté par SLTT.
--   - écritures : seulement celles SANS dossier_id (les écritures liées à
--     un dossier sont déjà reflétées dans dossiers.montant_paye — les
--     compter ici doublerait le montant, cf. la même règle dans
--     client-stats.ts).
--   - factures : neutralisées (débit/crédit à 0) si statut 'Annulée',
--     puisqu'une facture annulée n'engage plus le client.
-- Le solde cumulé est calculé par window function, trié par (date, id)
-- par client — même ordre de tri que le code TypeScript.
--
-- security_invoker = true (PG15+, requis) : sans cette option, une vue
-- s'exécute par défaut avec les droits de son propriétaire et peut
-- contourner le RLS des tables sous-jacentes. Avec security_invoker, le
-- RLS de dossiers/ecritures/factures s'applique à l'utilisateur qui
-- interroge la vue — un rôle sans comptabilite:read ne verra aucune ligne
-- "Paiement", exactement comme le reste de l'application aujourd'hui.

create or replace view public.classeur_mouvements
with (security_invoker = true) as
with base as (
  select
    'dossier-' || d.id::text as id,
    d.id as source_id,
    d.client_id,
    '22222222-2222-2222-2222-222222222222'::uuid as societe_id,
    'Dossier'::text as type,
    d.date,
    d.reference,
    'Dossier transit — ' || d.nature as libelle,
    d.montant_investi as debit,
    d.montant_paye as credit,
    d.statut as statut
  from public.dossiers d

  union all

  select
    'ecriture-' || e.id::text as id,
    e.id as source_id,
    e.client_id,
    e.societe_id,
    'Paiement'::text as type,
    e.date,
    'ÉCR-' || upper(left(e.id::text, 8)) as reference,
    coalesce(nullif(trim(e.note), ''), 'Bon de paiement') as libelle,
    e.montant_investi as debit,
    e.montant_paye as credit,
    case when e.montant_paye >= e.montant_investi then 'Soldé' else 'En attente' end as statut
  from public.ecritures e
  where e.dossier_id is null

  union all

  select
    'facture-' || f.id::text as id,
    f.id as source_id,
    f.client_id,
    f.societe_id,
    'Facture'::text as type,
    f.date,
    f.numero as reference,
    coalesce(
      (select fl.description from public.facture_lignes fl
       where fl.facture_id = f.id order by fl.created_at, fl.id limit 1),
      'Facture'
    ) as libelle,
    case when f.statut = 'Annulée' then 0 else f.montant_ttc end as debit,
    case when f.statut = 'Annulée' then 0 else f.montant_paye end as credit,
    f.statut as statut
  from public.factures f
)
select
  b.id,
  b.source_id,
  b.client_id,
  b.societe_id,
  coalesce(s.nom, 'Non affecté') as societe_nom,
  b.type,
  b.date,
  b.reference,
  b.libelle,
  b.debit,
  b.credit,
  b.statut,
  sum(b.debit - b.credit) over (
    partition by b.client_id order by b.date, b.id
    rows between unbounded preceding and current row
  ) as solde_cumule
from base b
left join public.societes s on s.id = b.societe_id;

grant select on public.classeur_mouvements to authenticated;

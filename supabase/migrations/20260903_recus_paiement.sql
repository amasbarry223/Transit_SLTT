-- Reçus de paiement — document autonome (Nom/Prénom/Somme/Motif/Montant payé),
-- imprimable, sans lien avec Comptabilité générale ni Écritures.
-- `reste` et `statut` sont des colonnes générées (même formule que
-- src/lib/recus-paiement.ts) pour cohérence liste/filtres/impression.
-- Permissions dédiées : recus-paiement:read / recus-paiement:write.
-- Périmètre RLS par annexe (comme clients, dossiers…).

create table if not exists public.recus_paiement (
    id uuid primary key default gen_random_uuid(),
    reference text unique not null, -- format "RECU-{n}"
    annexe_id uuid references public.annexes(id) not null,
    nom text not null,
    prenom text not null,
    somme numeric not null check (somme > 0),
    motif text not null,
    montant_paye numeric not null default 0 check (montant_paye >= 0),
    reste numeric generated always as (greatest(0::numeric, somme - montant_paye)) stored,
    statut text generated always as (
      case
        when montant_paye <= 0 then 'EN_ATTENTE'
        when montant_paye >= somme then 'SOLDE'
        else 'PARTIEL'
      end
    ) stored,
    cree_par text,
    created_at timestamptz not null default now(),
    constraint recus_paiement_montant_paye_lte_somme check (montant_paye <= somme)
);

create index if not exists idx_recus_paiement_annexe_id
  on public.recus_paiement(annexe_id);
create index if not exists idx_recus_paiement_created_at
  on public.recus_paiement(created_at desc);

alter table public.recus_paiement enable row level security;

drop policy if exists recus_paiement_select on public.recus_paiement;
drop policy if exists recus_paiement_mutate on public.recus_paiement;

create policy recus_paiement_select on public.recus_paiement for select to authenticated
  using (public.has_permission('recus-paiement:read') and public.has_annexe_access(annexe_id));
create policy recus_paiement_mutate on public.recus_paiement for all to authenticated
  using (public.has_permission('recus-paiement:write') and public.has_annexe_access(annexe_id))
  with check (public.has_permission('recus-paiement:write') and public.has_annexe_access(annexe_id));

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'recus_paiement'
  ) then
    alter publication supabase_realtime add table public.recus_paiement;
  end if;
end $$;

-- Module audit pour les entrées "Reçus de paiement"
alter table public.audit_logs drop constraint if exists audit_logs_module_check;

alter table public.audit_logs add constraint audit_logs_module_check check (
  module = any (
    array[
      'Authentification'::text,
      'Dossiers'::text,
      'Comptabilité'::text,
      'Factures'::text,
      'Stock'::text,
      'Bons'::text,
      'Clients'::text,
      'Transporteurs'::text,
      'Utilisateurs'::text,
      'Fournisseurs'::text,
      'Devis'::text,
      'Contrats'::text,
      'Dépenses'::text,
      'Sociétés'::text,
      'Annexes'::text,
      'Archives'::text,
      'Documents'::text,
      'Système'::text,
      'Reçus de paiement'::text
    ]
  )
);

-- Backfill annexe_id pour audit_logs liés aux reçus (best-effort)
update public.audit_logs al
set annexe_id = r.annexe_id
from public.recus_paiement r
where al.annexe_id is null and al.source_type = 'recu_paiement' and al.source_id = r.id;

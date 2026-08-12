-- Comptabilité générale — digitalisation du carnet de caisse Excel (SLTT).
-- 3 entités comptables distinctes, sur les 2 axes déjà présents dans le
-- schéma (F-ANNEXE : annexe = périmètre RLS réel ; société = filtre UI sans
-- RLS, cf. 20260809_annexes.sql) :
--   - Annexe Mali (annexe_id = ML)
--   - Annexe Côte d'Ivoire (annexe_id = CI)
--   - Société Top Doumani (societe_id, non ventilée par annexe — décision
--     produit : pas de nouveau périmètre RLS pour les sociétés, cf. session)
-- `entite_type` discrimine explicitement laquelle des deux colonnes fait foi
-- pour une ligne donnée (contrainte CHECK ci-dessous) plutôt que de laisser
-- les deux FK nullable livrées à l'interprétation.
--
-- `quantite`/`prix_unitaire` ne sont renseignées que pour Top Doumani
-- (Sortie = quantite * prix_unitaire) ; laissées nullable et inutilisées
-- pour Annexe Mali/CI plutôt que d'introduire une table séparée pour un
-- même journal à 90% commun.

create table if not exists public.operations_comptables (
    id uuid primary key default gen_random_uuid(),
    reference text unique not null, -- format "OPC-{n}"
    entite_type text not null check (entite_type in ('annexe', 'societe')),
    annexe_id uuid references public.annexes(id),
    societe_id uuid references public.societes(id),
    date date not null default current_date,
    client_id uuid references public.clients(id) on delete set null,
    client_nom text not null, -- tiers en clair (BINA DEMBELE, EDY, Zhu hai…) — pas toujours un Client existant
    nature text not null,
    type text not null check (type in ('Entrée', 'Sortie')),
    montant numeric not null default 0 check (montant >= 0),
    quantite numeric,
    prix_unitaire numeric,
    source text not null default 'saisie' check (source in ('saisie', 'import_excel', 'import_ocr')),
    import_ref text, -- nom de fichier / identifiant de lot d'import, pour traçabilité
    cree_par text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint operations_comptables_entite_coherente check (
      (entite_type = 'annexe' and annexe_id is not null and societe_id is null)
      or
      (entite_type = 'societe' and societe_id is not null and annexe_id is null)
    )
);

drop trigger if exists trg_update_operations_comptables_updated_at on public.operations_comptables;
create trigger trg_update_operations_comptables_updated_at
  before update on public.operations_comptables
  for each row execute procedure public.update_updated_at_column();

create index if not exists idx_operations_comptables_annexe_date
  on public.operations_comptables(annexe_id, date) where annexe_id is not null;
create index if not exists idx_operations_comptables_societe_date
  on public.operations_comptables(societe_id, date) where societe_id is not null;
create index if not exists idx_operations_comptables_client_id
  on public.operations_comptables(client_id) where client_id is not null;

alter table public.operations_comptables enable row level security;

drop policy if exists operations_comptables_select on public.operations_comptables;
drop policy if exists operations_comptables_mutate on public.operations_comptables;

-- Les lignes "societe" (Top Doumani) ne sont pas ventilées par annexe : pas
-- de restriction has_annexe_access supplémentaire, comme décidé (pas de
-- nouveau périmètre RLS pour societe_id). Les lignes "annexe" (Mali/CI)
-- restent soumises au cloisonnement standard.
create policy operations_comptables_select on public.operations_comptables for select to authenticated
  using (
    public.has_permission('comptabilite:read')
    and (entite_type = 'societe' or public.has_annexe_access(annexe_id))
  );
create policy operations_comptables_mutate on public.operations_comptables for all to authenticated
  using (
    public.has_permission('comptabilite:write')
    and (entite_type = 'societe' or public.has_annexe_access(annexe_id))
  )
  with check (
    public.has_permission('comptabilite:write')
    and (entite_type = 'societe' or public.has_annexe_access(annexe_id))
  );

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'operations_comptables'
  ) then
    alter publication supabase_realtime add table public.operations_comptables;
  end if;
end $$;

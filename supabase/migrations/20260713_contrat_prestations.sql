-- F6 — Prestations optionnelles du contrat ("intentions facultatives").
-- Libellé UI unique : voir PRESTATION_OPTIONNELLE_LABEL dans domain-types.ts.
-- Pas de "on delete cascade" sur contrat_id : bloque la suppression du contrat
-- tant qu'il porte des prestations (même politique que depenses).
create table if not exists public.contrat_prestations (
    id uuid primary key default gen_random_uuid(),
    contrat_id uuid references public.contrats(id) not null,
    libelle text not null,
    description text,
    montant numeric,
    statut text not null check (statut in ('Prévue', 'Réalisée', 'Annulée')) default 'Prévue',
    date_prevue date,
    date_realisation date,
    cree_par text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger trg_update_contrat_prestations_updated_at
  before update on public.contrat_prestations
  for each row execute procedure public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_contrat_prestations_contrat_id ON public.contrat_prestations(contrat_id);
CREATE INDEX IF NOT EXISTS idx_contrat_prestations_statut ON public.contrat_prestations(statut);

alter table public.contrat_prestations enable row level security;
create policy contrat_prestations_select on public.contrat_prestations for select to authenticated
  using (public.has_permission('contrats:read'));
create policy contrat_prestations_mutate on public.contrat_prestations for all to authenticated
  using (public.has_permission('contrats:write')) with check (public.has_permission('contrats:write'));

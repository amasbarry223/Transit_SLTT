-- F3 — Contrats (entreposage).
create table if not exists public.contrats (
    id uuid primary key default gen_random_uuid(),
    reference text unique not null,
    societe_id uuid references public.societes(id) not null,
    client_id uuid references public.clients(id) on delete cascade not null,
    objet text not null,
    date_debut date not null default current_date,
    date_fin date,
    montant numeric not null default 0,
    statut text not null check (statut in ('Actif', 'Clôturé', 'Suspendu')) default 'Actif',
    notes text,
    cree_par text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger trg_update_contrats_updated_at
  before update on public.contrats
  for each row execute procedure public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_contrats_societe_id ON public.contrats(societe_id);
CREATE INDEX IF NOT EXISTS idx_contrats_client_id ON public.contrats(client_id);
CREATE INDEX IF NOT EXISTS idx_contrats_statut ON public.contrats(statut);

alter table public.contrats enable row level security;
create policy contrats_select on public.contrats for select to authenticated
  using (public.has_permission('contrats:read'));
create policy contrats_mutate on public.contrats for all to authenticated
  using (public.has_permission('contrats:write')) with check (public.has_permission('contrats:write'));

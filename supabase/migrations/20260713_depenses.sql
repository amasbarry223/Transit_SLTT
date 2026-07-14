-- F4 — Dépenses liées à un contrat.
-- Pas de "on delete cascade" sur contrat_id : action par défaut NO ACTION,
-- ce qui BLOQUE la suppression d'un contrat tant qu'il porte des dépenses
-- (décision produit F3 : blocage, pas de cascade).
create table if not exists public.depenses (
    id uuid primary key default gen_random_uuid(),
    contrat_id uuid references public.contrats(id) not null,
    societe_id uuid references public.societes(id) not null, -- dénormalisé depuis le contrat pour les agrégats F5
    libelle text not null,
    montant numeric not null default 0,
    date_depense date not null default current_date,
    mode_paiement text not null check (mode_paiement in ('Espèces', 'Virement', 'Mobile Money', 'Chèque')),
    justificatif_path text, -- même bucket contrat-fichiers, scan optionnel
    note text,
    cree_par text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger trg_update_depenses_updated_at
  before update on public.depenses
  for each row execute procedure public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_depenses_contrat_id ON public.depenses(contrat_id);
CREATE INDEX IF NOT EXISTS idx_depenses_societe_id ON public.depenses(societe_id);
CREATE INDEX IF NOT EXISTS idx_depenses_date_depense ON public.depenses(date_depense);

alter table public.depenses enable row level security;
create policy depenses_select on public.depenses for select to authenticated
  using (public.has_permission('contrats:read'));
create policy depenses_mutate on public.depenses for all to authenticated
  using (public.has_permission('contrats:write')) with check (public.has_permission('contrats:write'));

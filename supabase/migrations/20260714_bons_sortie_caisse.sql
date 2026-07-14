-- Bon de sortie de caisse (décaissement) — document distinct des bons de
-- sortie de marchandise (entreposage). Ex. : paiement d'honoraires, frais
-- divers, réglé en espèces/caisse, sur papier à en-tête de la société mère
-- (pas rattaché à une société entrepôt Top Doumani / Traçabilité Emballage).
-- Pattern : factures / facture_lignes → bons_sortie_caisse / bons_sortie_caisse_lignes.
-- Permissions : réutilise bons:read / bons:write (même écran, deux onglets).

create table if not exists public.bons_sortie_caisse (
    id uuid primary key default gen_random_uuid(),
    reference text unique not null, -- format "N°{n}", séquence indépendante des bons stock
    date date not null default current_date,
    montant_total numeric not null default 0,
    cree_par text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

drop trigger if exists trg_update_bons_sortie_caisse_updated_at on public.bons_sortie_caisse;
create trigger trg_update_bons_sortie_caisse_updated_at
  before update on public.bons_sortie_caisse
  for each row execute procedure public.update_updated_at_column();

create table if not exists public.bons_sortie_caisse_lignes (
    id uuid primary key default gen_random_uuid(),
    bon_id uuid references public.bons_sortie_caisse(id) on delete cascade not null,
    date date not null default current_date,
    beneficiaire text not null, -- "Prénom et Nom"
    motif text not null,
    montant numeric not null default 0,
    created_at timestamptz not null default now()
);

create index if not exists idx_bons_sortie_caisse_lignes_bon_id
  on public.bons_sortie_caisse_lignes(bon_id);

alter table public.bons_sortie_caisse enable row level security;
alter table public.bons_sortie_caisse_lignes enable row level security;

drop policy if exists bons_sortie_caisse_select on public.bons_sortie_caisse;
drop policy if exists bons_sortie_caisse_mutate on public.bons_sortie_caisse;
drop policy if exists bons_sortie_caisse_lignes_select on public.bons_sortie_caisse_lignes;
drop policy if exists bons_sortie_caisse_lignes_mutate on public.bons_sortie_caisse_lignes;

create policy bons_sortie_caisse_select on public.bons_sortie_caisse
  for select to authenticated
  using (public.has_permission('bons:read'));

create policy bons_sortie_caisse_mutate on public.bons_sortie_caisse
  for all to authenticated
  using (public.has_permission('bons:write'))
  with check (public.has_permission('bons:write'));

create policy bons_sortie_caisse_lignes_select on public.bons_sortie_caisse_lignes
  for select to authenticated
  using (public.has_permission('bons:read'));

create policy bons_sortie_caisse_lignes_mutate on public.bons_sortie_caisse_lignes
  for all to authenticated
  using (public.has_permission('bons:write'))
  with check (public.has_permission('bons:write'));

-- Realtime dashboard (idempotent)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bons_sortie_caisse'
  ) then
    alter publication supabase_realtime add table public.bons_sortie_caisse;
  end if;
end $$;

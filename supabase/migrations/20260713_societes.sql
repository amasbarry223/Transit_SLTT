-- F1 — Table des sociétés (Top Doumani / Traçabilité Emballage).
-- Table plutôt qu'enum : permet d'ajouter une 3e société plus tard sans migration de type.
create table if not exists public.societes (
    id uuid primary key default gen_random_uuid(),
    nom text not null unique,
    actif boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger trg_update_societes_updated_at
  before update on public.societes
  for each row execute procedure public.update_updated_at_column();

-- IDs fixes (littéraux) pour pouvoir les référencer comme DEFAULT de colonne
-- dans les migrations suivantes (un DEFAULT de colonne ne peut pas contenir
-- de sous-requête). Top Doumani = société par défaut (1re listée, décision produit).
insert into public.societes (id, nom, actif) values
  ('11111111-1111-1111-1111-111111111111', 'Top Doumani', true),
  ('22222222-2222-2222-2222-222222222222', 'Traçabilité Emballage', true)
on conflict (nom) do nothing;

alter table public.societes enable row level security;

-- Lecture ouverte à tous les authentifiés (pas de module de permission dédié :
-- le sélecteur société doit fonctionner pour n'importe quel rôle ayant accès
-- à au moins un des écrans société-scopés).
create policy societes_select on public.societes for select to authenticated using (true);

-- Écriture réservée (admin uniquement, via parametres:write) — préparé pour une
-- future capacité d'ajout de société ; aucun écran ne l'exploite dans cette phase.
create policy societes_mutate on public.societes for all to authenticated
  using (public.has_permission('parametres:write'))
  with check (public.has_permission('parametres:write'));

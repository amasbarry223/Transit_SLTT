-- F-ANNEXE — Table des annexes (implantations physiques : Mali / Côte d'Ivoire).
-- Axe orthogonal à `societes` (SLTT/Top Doumani = entité légale/comptable) :
-- l'annexe est le lieu physique d'exploitation, cloisonné par RLS (cf.
-- 20260811_user_annexes.sql et 20260812_rls_annexe_scoping.sql), alors que
-- societe_id n'a jamais été qu'un filtre UI.
create table if not exists public.annexes (
    id uuid primary key default gen_random_uuid(),
    nom text not null unique,
    ville_siege text not null,
    adresse text,
    telephone text,
    rccm text,
    nif text,
    devise text not null default 'FCFA',
    actif boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger trg_update_annexes_updated_at
  before update on public.annexes
  for each row execute procedure public.update_updated_at_column();

-- IDs fixes pour servir de DEFAULT de colonne dans les migrations suivantes
-- (un DEFAULT ne peut pas contenir de sous-requête). Mali = siège historique,
-- annexe par défaut de toutes les données existantes.
insert into public.annexes (id, nom, ville_siege, adresse, telephone, rccm, nif, devise, actif) values
  ('33333333-3333-3333-3333-333333333333', 'Mali', 'Bamako',
   'Niaréla - Rue 516 porte C/63', '+223 76 96 47 06 / 92 92 46 48',
   'Ma.Bko.2025 B.5897', '084151062H', 'FCFA', true),
  ('44444444-4444-4444-4444-444444444444', 'Côte d''Ivoire', 'Abidjan',
   null, null, null, null, 'FCFA', true)
on conflict (nom) do nothing;

alter table public.annexes enable row level security;

-- Lecture ouverte à tous les authentifiés : le sélecteur d'annexe et les
-- formulaires de création ont besoin de lister les annexes indépendamment
-- du module consulté (pas de permission dédiée pour ça, comme societes).
create policy annexes_select on public.annexes for select to authenticated using (true);

-- Écriture réservée à parametres:write (édition identité légale annexe
-- depuis Paramètres) — aucune création/suppression exposée côté UI pour
-- l'instant, les 2 annexes sont fixes.
create policy annexes_mutate on public.annexes for all to authenticated
  using (public.has_permission('parametres:write'))
  with check (public.has_permission('parametres:write'));

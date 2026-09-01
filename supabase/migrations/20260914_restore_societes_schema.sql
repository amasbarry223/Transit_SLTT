-- Restaure public.societes (renommée en entreprise côté base) et les
-- colonnes societe_id attendues par l'app. Sans ça, fetchData échoue dès
-- le groupe core (select societes + societe_id) : le profil ne se charge
-- pas et l'UI affiche « Accès non autorisé » après une connexion réussie.

do $$
begin
  if to_regclass('public.societes') is null
     and to_regclass('public.entreprise') is not null then
    alter table public.entreprise rename to societes;
  end if;
end $$;

-- L'ancienne table « entreprise » n'autorisait qu'une seule ligne.
drop index if exists public.idx_entreprise_singleton;

alter table public.societes add column if not exists actif boolean not null default true;
alter table public.societes add column if not exists is_transit boolean not null default false;
alter table public.societes add column if not exists raison_sociale text;
alter table public.societes add column if not exists logo_url text;
alter table public.societes add column if not exists adresse text;
alter table public.societes add column if not exists telephone text;
alter table public.societes add column if not exists rccm text;
alter table public.societes add column if not exists nif text;
alter table public.societes add column if not exists afficher_nom_avec_logo boolean not null default true;
alter table public.societes add column if not exists signataire_dg text;
alter table public.societes add column if not exists signataire_pdg text;

-- SLTT existante (id non canonique) → id transit historique de l'app.
update public.societes
set id = '22222222-2222-2222-2222-222222222222'
where nom = 'SLTT'
  and id is distinct from '22222222-2222-2222-2222-222222222222'
  and not exists (
    select 1 from public.societes where id = '22222222-2222-2222-2222-222222222222'
  );

insert into public.societes (
  id, nom, raison_sociale, actif, is_transit, logo_url,
  adresse, telephone, rccm, nif, afficher_nom_avec_logo,
  signataire_dg, signataire_pdg
) values (
  '22222222-2222-2222-2222-222222222222',
  'SLTT',
  'Traoré de Logistique Transit-Transport',
  true,
  true,
  '/logoV.png',
  'Niaréla - Rue 516 porte C/63',
  '+223 76 96 47 06 / 92 92 46 48',
  'Ma.Bko.2025 B.5897',
  '084151062H',
  true,
  'Ali Badra TRAORE',
  'Abdoul TRAORÉ'
)
on conflict (id) do update set
  nom = excluded.nom,
  raison_sociale = coalesce(public.societes.raison_sociale, excluded.raison_sociale),
  actif = true,
  is_transit = true;

insert into public.societes (
  id, nom, nif, actif, is_transit, logo_url, afficher_nom_avec_logo
) values (
  '11111111-1111-1111-1111-111111111111',
  'Top Doumani',
  '082254575X',
  true,
  false,
  '/logo-TOP-DOUMANI.png',
  false
)
on conflict (id) do nothing;

update public.societes
set is_transit = (id = '22222222-2222-2222-2222-222222222222');

create unique index if not exists idx_societes_single_transit
  on public.societes ((true))
  where is_transit = true;

drop trigger if exists trg_update_societes_updated_at on public.societes;
create trigger trg_update_societes_updated_at
  before update on public.societes
  for each row execute procedure public.update_updated_at_column();

alter table public.societes enable row level security;
drop policy if exists societes_select on public.societes;
drop policy if exists societes_mutate on public.societes;
create policy societes_select on public.societes
  for select to authenticated using (true);
create policy societes_mutate on public.societes
  for all to authenticated
  using (public.has_permission('parametres:write'))
  with check (public.has_permission('parametres:write'));

grant select, insert, update, delete on public.societes to authenticated;

-- Colonnes societe_id attendues par fetchCore / fetchSecondary + embeds societes(nom).
do $$
declare
  sltt uuid := '22222222-2222-2222-2222-222222222222';
  tbl text;
  not_null_tables text[] := array[
    'stock_items', 'mouvements', 'bons_sortie', 'bons_sortie_caisse',
    'dossiers', 'devis', 'clients', 'contrats', 'depenses'
  ];
  nullable_tables text[] := array[
    'ecritures', 'factures', 'operations_comptables', 'clotures_caisse',
    'documents', 'archives', 'excel_workbooks'
  ];
begin
  foreach tbl in array not_null_tables || nullable_tables
  loop
    if to_regclass(format('public.%I', tbl)) is null then
      continue;
    end if;
    execute format(
      'alter table public.%I add column if not exists societe_id uuid references public.societes(id)',
      tbl
    );
    execute format(
      'update public.%I set societe_id = $1 where societe_id is null',
      tbl
    ) using sltt;
    execute format(
      'create index if not exists %I on public.%I (societe_id)',
      'idx_' || tbl || '_societe_id',
      tbl
    );
  end loop;

  foreach tbl in array not_null_tables
  loop
    if to_regclass(format('public.%I', tbl)) is null then
      continue;
    end if;
    execute format(
      'alter table public.%I alter column societe_id set default %L',
      tbl,
      sltt
    );
    execute format('alter table public.%I alter column societe_id set not null', tbl);
  end loop;
end $$;

notify pgrst, 'reload schema';

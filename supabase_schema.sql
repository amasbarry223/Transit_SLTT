-- =====================================================================
-- SCHEMA DE BASE DE DONNEES POUR TRANSIT SLTT (SUPABASE / POSTGRESQL)
-- =====================================================================
-- Ce fichier contient toutes les requêtes SQL (DDL, Triggers, RLS)
-- nécessaires pour configurer la base de données Supabase pour l'application.
-- Projet Supabase ID : qhpmegadoumarppmdbfn
-- =====================================================================

-- Activation de l'extension pour la génération automatique d'UUIDs
create extension if not exists "uuid-ossp";

-- Désactivation temporaire des triggers pour éviter les interférences lors de la création
SET session_replication_role = 'replica';

-- =====================================================================
-- 1. TABLE DES PROFILS D'UTILISATEURS (Liée à auth.users de Supabase)
-- =====================================================================
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    nom text not null,
    email text unique not null,
    role text not null check (role in ('Administrateur', 'Agent de transit', 'Comptable', 'Magasinier', 'Commercial')),
    permissions text[] not null default '{}',
    actif boolean not null default true,
    derniere_connexion timestamptz default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================================
-- 2. TABLE DES CLIENTS
-- =====================================================================
create table if not exists public.clients (
    id uuid primary key default gen_random_uuid(),
    nom text not null,
    type text not null check (type in ('Particulier', 'Entreprise')),
    telephone text not null,
    email text not null,
    adresse text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================================
-- 3. TABLE DES DOSSIERS DE TRANSIT
-- =====================================================================
create table if not exists public.dossiers (
    id uuid primary key default gen_random_uuid(),
    reference text unique not null,
    client_id uuid references public.clients(id) on delete cascade not null,
    bl text not null,
    camion text not null,
    nature text not null,
    droit_douane numeric not null default 0,
    frais_circuit numeric not null default 0,
    frais_prestation numeric not null default 0,
    montant_investi numeric not null default 0,
    montant_paye numeric not null default 0,
    statut text not null check (statut in ('En cours', 'Dédouané', 'Livré', 'Soldé')) default 'En cours',
    date date not null default current_date,
    date_echeance date,
    date_dedouanement date,
    mode_transport text check (mode_transport in ('Maritime', 'Aérien', 'Routier', 'Ferroviaire')),
    no_conteneur text,
    port_entree text,
    poids_total numeric,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================================
-- 4. TABLE DES FOURNISSEURS / SOUS-TRAITANTS
-- =====================================================================
create table if not exists public.fournisseurs (
    id uuid primary key default gen_random_uuid(),
    nom text not null,
    type text not null check (type in ('Transporteur', 'Manutentionnaire', 'Commissionnaire en douane', 'Loueur', 'Autre')),
    contact text not null,
    telephone text not null,
    email text not null,
    adresse text not null,
    tarif_contractuel numeric,
    statut text not null check (statut in ('Actif', 'Inactif')) default 'Actif',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================================
-- 5. TABLE D'ASSIGNATION DES FOURNISSEURS AUX DOSSIERS (Budget & Réel)
-- =====================================================================
create table if not exists public.dossier_fournisseurs (
    id uuid primary key default gen_random_uuid(),
    dossier_id uuid references public.dossiers(id) on delete cascade not null,
    fournisseur_id uuid references public.fournisseurs(id) on delete cascade not null,
    description text not null,
    montant_budgete numeric not null default 0,
    montant_reel numeric not null default 0,
    statut text not null check (statut in ('En attente', 'Payé', 'Litige')) default 'En attente',
    date date not null default current_date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================================
-- 6. TABLE DES ECRITURES COMPTABLES / LIVRE DES COMPTES (Entrées/Sorties)
-- =====================================================================
create table if not exists public.ecritures (
    id uuid primary key default gen_random_uuid(),
    date date not null default current_date,
    date_paiement date,
    client_id uuid references public.clients(id) on delete cascade not null,
    dossier_id uuid references public.dossiers(id) on delete set null,
    montant_investi numeric not null default 0,
    montant_paye numeric not null default 0,
    mode_paiement text not null check (mode_paiement in ('Espèces', 'Virement', 'Mobile Money', 'Chèque')),
    note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================================
-- 7. TABLE DES ARTICLES DE STOCK / INVENTAIRE
-- =====================================================================
create table if not exists public.stock_items (
    id uuid primary key default gen_random_uuid(),
    marchandise text not null,
    quantite numeric not null default 0,
    unite text not null,
    seuil numeric not null default 0,
    depositaire text not null,
    commercial text not null,
    somme_payee numeric not null default 0,
    reste_a_payer numeric not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================================
-- 8. TABLE DES MOUVEMENTS DE STOCK
-- =====================================================================
create table if not exists public.mouvements (
    id uuid primary key default gen_random_uuid(),
    date timestamptz not null default now(),
    type text not null check (type in ('Entrée', 'Sortie')),
    stock_id uuid references public.stock_items(id) on delete cascade not null,
    marchandise text not null,
    quantite numeric not null default 0,
    unite text not null,
    responsable text not null,
    bon_ref text,
    motif text,
    created_at timestamptz not null default now()
);

-- =====================================================================
-- 9. TABLE DES BONS DE SORTIE DE STOCK
-- =====================================================================
create table if not exists public.bons_sortie (
    id uuid primary key default gen_random_uuid(),
    reference text unique not null,
    date date not null default current_date,
    client_id uuid references public.clients(id) on delete cascade not null,
    stock_id uuid references public.stock_items(id) on delete set null,
    marchandise text not null,
    quantite numeric not null default 0,
    unite text not null,
    motif text not null check (motif in ('Vente', 'Livraison', 'Transfert')),
    montant numeric not null default 0,
    statut text not null check (statut in ('Validé', 'Brouillon')) default 'Brouillon',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================================
-- 10. TABLE DES SOUS-DOSSIERS DE DOCUMENTS (Organisation dans un dossier)
-- =====================================================================
create table if not exists public.sub_dossiers (
    id uuid primary key default gen_random_uuid(),
    dossier_id uuid references public.dossiers(id) on delete cascade not null,
    nom text not null,
    description text,
    date_creation timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================================
-- 11. TABLE DES FICHIERS ET DOCUMENTS UPLOADEZ
-- =====================================================================
create table if not exists public.dossier_fichiers (
    id uuid primary key default gen_random_uuid(),
    dossier_id uuid references public.dossiers(id) on delete cascade not null,
    sous_dossier_id uuid references public.sub_dossiers(id) on delete set null,
    nom text not null,
    taille integer not null,
    type text not null,
    date_upload timestamptz not null default now(),
    data_url text not null,
    created_at timestamptz not null default now()
);

-- =====================================================================
-- 12. TABLE DES COMMENTAIRES DANS LES DOSSIERS
-- =====================================================================
create table if not exists public.dossier_comments (
    id uuid primary key default gen_random_uuid(),
    dossier_id uuid references public.dossiers(id) on delete cascade not null,
    profile_id uuid references public.profiles(id) on delete set null,
    user_name text not null,
    texte text not null,
    date timestamptz not null default now(),
    created_at timestamptz not null default now()
);

-- =====================================================================
-- 13. TABLE DES DEVIS
-- =====================================================================
create table if not exists public.devis (
    id uuid primary key default gen_random_uuid(),
    reference text unique not null,
    client_id uuid references public.clients(id) on delete cascade not null,
    nature text not null,
    droit_douane numeric not null default 0,
    frais_circuit numeric not null default 0,
    frais_prestation numeric not null default 0,
    total numeric not null default 0,
    statut text not null check (statut in ('Brouillon', 'Envoyé', 'Accepté', 'Refusé', 'Expiré')) default 'Brouillon',
    date_creation date not null default current_date,
    date_validite date not null,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================================
-- 14. TABLE DES TRANSPORTEURS (Parc auto / Gestion Flotte externe)
-- =====================================================================
create table if not exists public.transporteurs (
    id uuid primary key default gen_random_uuid(),
    nom text not null,
    contact text not null,
    telephone text not null,
    email text,
    vehicule text not null check (vehicule in ('Camion', 'Remorque', 'Semi-remorque', 'Benne', 'Fourgon')),
    immatriculation text not null,
    trajet text not null,
    capacite numeric not null,
    statut text not null check (statut in ('Actif', 'Inactif')) default 'Actif',
    date_creation date not null default current_date,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================================
-- 15. TABLE DES FACTURES
-- =====================================================================
create table if not exists public.factures (
    id uuid primary key default gen_random_uuid(),
    numero text unique not null,
    dossier_id uuid references public.dossiers(id) on delete set null,
    client_id uuid references public.clients(id) on delete cascade not null,
    date date not null default current_date,
    date_echeance date not null,
    statut text not null check (statut in ('Brouillon', 'Envoyée', 'Partielle', 'Soldée', 'Annulée')) default 'Brouillon',
    taux_tva numeric not null default 18.0, -- TVA par défaut à 18% (Mali / UEMOA)
    montant_ht numeric not null default 0,
    montant_tva numeric not null default 0,
    montant_ttc numeric not null default 0,
    montant_paye numeric not null default 0,
    notes text,
    cree_par text not null,
    cree_le timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================================
-- 16. TABLE DES LIGNES DE FACTURES
-- =====================================================================
create table if not exists public.facture_lignes (
    id uuid primary key default gen_random_uuid(),
    facture_id uuid references public.factures(id) on delete cascade not null,
    description text not null,
    quantite numeric not null default 1,
    prix_unitaire numeric not null default 0,
    montant_ht numeric not null default 0,
    created_at timestamptz not null default now()
);

-- =====================================================================
-- 17. TABLE DES JOURNAUX D'AUDIT (Historique d'activité de la plateforme)
-- =====================================================================
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    date timestamptz not null default now(),
    user_name text not null,
    module text not null check (module in ('Authentification', 'Dossiers', 'Comptabilité', 'Factures', 'Stock', 'Bons', 'Clients', 'Transporteurs', 'Utilisateurs', 'Fournisseurs', 'Devis')),
    action text not null check (action in ('Connexion', 'Création', 'Modification', 'Validation', 'Paiement', 'Export', 'Suppression')),
    detail text not null,
    ip text
);

-- Rétablissement du mode de réplication normal pour déclencher les triggers
SET session_replication_role = 'origin';

-- =====================================================================
-- TRIGGERS POUR LA MISE A JOUR AUTOMATIQUE DU CHAMP `updated_at`
-- =====================================================================

-- Fonction commune pour mettre à jour la colonne updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Application de la fonction aux tables concernées
create trigger trg_update_profiles_updated_at before update on public.profiles for each row execute procedure public.update_updated_at_column();
create trigger trg_update_clients_updated_at before update on public.clients for each row execute procedure public.update_updated_at_column();
create trigger trg_update_dossiers_updated_at before update on public.dossiers for each row execute procedure public.update_updated_at_column();
create trigger trg_update_fournisseurs_updated_at before update on public.fournisseurs for each row execute procedure public.update_updated_at_column();
create trigger trg_update_dossier_fournisseurs_updated_at before update on public.dossier_fournisseurs for each row execute procedure public.update_updated_at_column();
create trigger trg_update_ecritures_updated_at before update on public.ecritures for each row execute procedure public.update_updated_at_column();
create trigger trg_update_stock_items_updated_at before update on public.stock_items for each row execute procedure public.update_updated_at_column();
create trigger trg_update_bons_sortie_updated_at before update on public.bons_sortie for each row execute procedure public.update_updated_at_column();
create trigger trg_update_sub_dossiers_updated_at before update on public.sub_dossiers for each row execute procedure public.update_updated_at_column();
create trigger trg_update_devis_updated_at before update on public.devis for each row execute procedure public.update_updated_at_column();
create trigger trg_update_transporteurs_updated_at before update on public.transporteurs for each row execute procedure public.update_updated_at_column();
create trigger trg_update_factures_updated_at before update on public.factures for each row execute procedure public.update_updated_at_column();

-- =====================================================================
-- DECLENCHEUR POUR LA CREATION AUTOMATIQUE DU PROFIL DE L'UTILISATEUR
-- =====================================================================
-- Ce trigger s'active lorsqu'un utilisateur s'inscrit via Supabase Auth.
-- Les métadonnées utilisateur 'nom' et 'role' sont récupérées depuis l'inscription.
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_permissions text[];
begin
  select coalesce(array_agg(value), array[]::text[])
  into v_permissions
  from jsonb_array_elements_text(
    coalesce(new.raw_user_meta_data->'permissions', '[]'::jsonb)
  ) as t(value);

  insert into public.profiles (id, nom, email, role, permissions, actif)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nom', new.raw_user_meta_data->>'name', 'Utilisateur'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'Agent de transit'),
    v_permissions,
    true
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.profiles where id = auth.uid() and role = 'Administrateur' and actif = true
); $$;

create or replace function public.user_is_active()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.profiles where id = auth.uid() and actif = true
); $$;

create or replace function public.has_permission(perm text)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.profiles p
  where p.id = auth.uid()
    and p.actif = true
    and (p.role = 'Administrateur' or perm = any(p.permissions))
); $$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================================
-- TRIGGERS DE CALCULS DE MONTANTS SUR LES FACTURES ET LEURS LIGNES
-- =====================================================================

-- 1. Calcul du HT par ligne de facture (quantité * prix_unitaire)
create or replace function public.calculate_facture_ligne_ht()
returns trigger as $$
begin
  new.montant_ht := new.quantite * new.prix_unitaire;
  return new;
end;
$$ language plpgsql;

create or replace trigger trg_calculate_facture_ligne_ht
  before insert or update on public.facture_lignes
  for each row execute procedure public.calculate_facture_ligne_ht();

-- 2. Recalcul des totaux de facture lors de modification des lignes (insert, update, delete)
create or replace function public.recalculate_facture_totals()
returns trigger as $$
declare
  v_facture_id uuid;
  v_sum_ht numeric;
  v_taux_tva numeric;
begin
  if tg_op = 'DELETE' then
    v_facture_id := old.facture_id;
  else
    v_facture_id := new.facture_id;
  end if;

  -- Somme HT des lignes
  select coalesce(sum(montant_ht), 0) into v_sum_ht
  from public.facture_lignes
  where facture_id = v_facture_id;

  -- Taux de TVA appliqué
  select taux_tva into v_taux_tva
  from public.factures
  where id = v_facture_id;

  -- Mise à jour globale de la facture
  update public.factures
  set
    montant_ht = v_sum_ht,
    montant_tva = round(v_sum_ht * (v_taux_tva / 100.0), 2),
    montant_ttc = round(v_sum_ht * (1.0 + (v_taux_tva / 100.0)), 2)
  where id = v_facture_id;

  return null;
end;
$$ language plpgsql;

create or replace trigger trg_recalculate_facture_totals
  after insert or update or delete on public.facture_lignes
  for each row execute procedure public.recalculate_facture_totals();

-- 3. Recalcul lors du changement direct de TVA ou HT de la facture
create or replace function public.recalculate_facture_on_tva_change()
returns trigger as $$
begin
  if old.taux_tva <> new.taux_tva or old.montant_ht <> new.montant_ht then
    new.montant_tva := round(new.montant_ht * (new.taux_tva / 100.0), 2);
    new.montant_ttc := round(new.montant_ht * (1.0 + (new.taux_tva / 100.0)), 2);
  end if;
  return new;
end;
$$ language plpgsql;

create or replace trigger trg_recalculate_facture_on_tva_change
  before update on public.factures
  for each row execute procedure public.recalculate_facture_on_tva_change();

-- =====================================================================
-- VIEWS POUR LES STATISTIQUES AGREGUEES (Evite de stocker en dur)
-- =====================================================================

-- 1. View Client avec statistiques dynamiques
create or replace view public.v_clients_with_stats as
select 
  c.id,
  c.nom,
  c.type,
  c.telephone,
  c.email,
  c.adresse,
  coalesce(count(distinct d.id), 0) as nb_dossiers,
  coalesce(sum(d.montant_paye), 0) as total_paye,
  coalesce(sum(greatest(0, d.montant_investi - d.montant_paye)), 0) as total_du,
  c.created_at,
  c.updated_at
from public.clients c
left join public.dossiers d on d.client_id = c.id
group by c.id;

-- 2. View Fournisseurs avec statistiques dynamiques
create or replace view public.v_fournisseurs_with_stats as
select 
  f.id,
  f.nom,
  f.type,
  f.contact,
  f.telephone,
  f.email,
  f.adresse,
  f.tarif_contractuel,
  f.statut,
  coalesce(count(distinct df.dossier_id), 0) as nb_dossiers,
  coalesce(sum(df.montant_reel), 0) as montant_total,
  f.created_at,
  f.updated_at
from public.fournisseurs f
left join public.dossier_fournisseurs df on df.fournisseur_id = f.id
group by f.id;

-- =====================================================================
-- SECURITE RLS (Row Level Security) - POLITIKES PAR DEFAUT
-- =====================================================================
-- Par défaut, nous autorisons les utilisateurs authentifiés à effectuer
-- toutes les opérations de CRUD, et tout le monde à lire les profils.
-- =====================================================================

-- Activer les RLS
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.dossiers enable row level security;
alter table public.fournisseurs enable row level security;
alter table public.dossier_fournisseurs enable row level security;
alter table public.ecritures enable row level security;
alter table public.stock_items enable row level security;
alter table public.mouvements enable row level security;
alter table public.bons_sortie enable row level security;
alter table public.sub_dossiers enable row level security;
alter table public.dossier_fichiers enable row level security;
alter table public.dossier_comments enable row level security;
alter table public.devis enable row level security;
alter table public.transporteurs enable row level security;
alter table public.factures enable row level security;
alter table public.facture_lignes enable row level security;
alter table public.audit_logs enable row level security;

-- Création des politiques génériques (Accès total pour les connectés)
-- Note : Dans un environnement de production strict, vous pouvez restreindre ces rôles par table.

-- Politiques Profils : Lecture pour tous les authentifiés, écriture/mise à jour seulement pour soi-même ou admin
create policy "Lecture des profils pour tous les authentifiés" on public.profiles for select to authenticated using (true);
create policy "Mise à jour de son propre profil" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Admin insert profiles" on public.profiles for insert to authenticated with check (public.is_admin());
create policy "Admin update profiles" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin delete profiles" on public.profiles for delete to authenticated using (public.is_admin());

-- Politiques par module (profiles.permissions)
create policy clients_select on public.clients for select to authenticated using (public.has_permission('clients:read'));
create policy clients_insert on public.clients for insert to authenticated with check (public.has_permission('clients:write'));
create policy clients_update on public.clients for update to authenticated using (public.has_permission('clients:write')) with check (public.has_permission('clients:write'));
create policy clients_delete on public.clients for delete to authenticated using (public.has_permission('clients:write'));

create policy dossiers_select on public.dossiers for select to authenticated using (public.has_permission('dossiers:read'));
create policy dossiers_insert on public.dossiers for insert to authenticated with check (public.has_permission('dossiers:write'));
create policy dossiers_update on public.dossiers for update to authenticated using (public.has_permission('dossiers:write') or public.has_permission('dossiers:transition')) with check (public.has_permission('dossiers:write') or public.has_permission('dossiers:transition'));
create policy dossiers_delete on public.dossiers for delete to authenticated using (public.has_permission('dossiers:write'));

create policy sub_dossiers_select on public.sub_dossiers for select to authenticated using (public.has_permission('dossiers:read'));
create policy sub_dossiers_mutate on public.sub_dossiers for all to authenticated using (public.has_permission('dossiers:write')) with check (public.has_permission('dossiers:write'));

create policy dossier_fichiers_select on public.dossier_fichiers for select to authenticated using (public.has_permission('dossiers:read'));
create policy dossier_fichiers_mutate on public.dossier_fichiers for all to authenticated using (public.has_permission('dossiers:write')) with check (public.has_permission('dossiers:write'));

create policy dossier_comments_select on public.dossier_comments for select to authenticated using (public.has_permission('dossiers:read'));
create policy dossier_comments_mutate on public.dossier_comments for all to authenticated using (public.has_permission('dossiers:write')) with check (public.has_permission('dossiers:write'));

create policy fournisseurs_select on public.fournisseurs for select to authenticated using (public.has_permission('fournisseurs:read'));
create policy fournisseurs_mutate on public.fournisseurs for all to authenticated using (public.has_permission('fournisseurs:write')) with check (public.has_permission('fournisseurs:write'));

create policy dossier_fournisseurs_select on public.dossier_fournisseurs for select to authenticated using (public.has_permission('fournisseurs:read') or public.has_permission('dossiers:read'));
create policy dossier_fournisseurs_mutate on public.dossier_fournisseurs for all to authenticated using (public.has_permission('fournisseurs:write') or public.has_permission('dossiers:write')) with check (public.has_permission('fournisseurs:write') or public.has_permission('dossiers:write'));

create policy ecritures_select on public.ecritures for select to authenticated using (public.has_permission('comptabilite:read'));
create policy ecritures_mutate on public.ecritures for all to authenticated using (public.has_permission('comptabilite:write')) with check (public.has_permission('comptabilite:write'));

create policy stock_items_select on public.stock_items for select to authenticated using (public.has_permission('stock:read'));
create policy stock_items_mutate on public.stock_items for all to authenticated using (public.has_permission('stock:write')) with check (public.has_permission('stock:write'));

create policy mouvements_select on public.mouvements for select to authenticated using (public.has_permission('stock:read'));
create policy mouvements_mutate on public.mouvements for all to authenticated using (public.has_permission('stock:write')) with check (public.has_permission('stock:write'));

create policy bons_select on public.bons_sortie for select to authenticated using (public.has_permission('bons:read'));
create policy bons_mutate on public.bons_sortie for all to authenticated using (public.has_permission('bons:write')) with check (public.has_permission('bons:write'));

create policy devis_select on public.devis for select to authenticated using (public.has_permission('devis:read'));
create policy devis_mutate on public.devis for all to authenticated using (public.has_permission('devis:write')) with check (public.has_permission('devis:write'));

create policy transporteurs_select on public.transporteurs for select to authenticated using (public.has_permission('transporteurs:read'));
create policy transporteurs_mutate on public.transporteurs for all to authenticated using (public.has_permission('transporteurs:write')) with check (public.has_permission('transporteurs:write'));

create policy factures_select on public.factures for select to authenticated using (public.has_permission('factures:read'));
create policy factures_mutate on public.factures for all to authenticated using (public.has_permission('factures:write')) with check (public.has_permission('factures:write'));

create policy facture_lignes_select on public.facture_lignes for select to authenticated using (public.has_permission('factures:read'));
create policy facture_lignes_mutate on public.facture_lignes for all to authenticated using (public.has_permission('factures:write')) with check (public.has_permission('factures:write'));

create policy audit_logs_select on public.audit_logs for select to authenticated using (public.has_permission('parametres:read') or public.is_admin());
create policy audit_logs_insert on public.audit_logs for insert to authenticated with check (public.user_is_active());
create policy audit_logs_delete on public.audit_logs for delete to authenticated using (public.is_admin());

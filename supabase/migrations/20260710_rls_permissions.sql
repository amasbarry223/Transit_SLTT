-- Migration RLS : alignement sur profiles.permissions (module:action)
-- À appliquer sur un projet Supabase existant.

create or replace function public.user_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and actif = true
  );
$$;

create or replace function public.has_permission(perm text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.actif = true
      and (
        p.role = 'Administrateur'
        or perm = any(p.permissions)
      )
  );
$$;

-- Macro helper via DO block : drop anciennes politiques permissives
do $$
declare
  t text;
begin
  foreach t in array array[
    'clients', 'dossiers', 'fournisseurs', 'dossier_fournisseurs', 'ecritures',
    'stock_items', 'mouvements', 'bons_sortie', 'sub_dossiers', 'dossier_fichiers',
    'dossier_comments', 'devis', 'transporteurs', 'factures', 'facture_lignes', 'audit_logs'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', 'CRUD complet pour tous les authentifiés', t);
  end loop;
end $$;

-- Clients
create policy clients_select on public.clients for select to authenticated
  using (public.has_permission('clients:read'));
create policy clients_insert on public.clients for insert to authenticated
  with check (public.has_permission('clients:write'));
create policy clients_update on public.clients for update to authenticated
  using (public.has_permission('clients:write')) with check (public.has_permission('clients:write'));
create policy clients_delete on public.clients for delete to authenticated
  using (public.has_permission('clients:write'));

-- Dossiers (+ tables liées)
create policy dossiers_select on public.dossiers for select to authenticated
  using (public.has_permission('dossiers:read'));
create policy dossiers_insert on public.dossiers for insert to authenticated
  with check (public.has_permission('dossiers:write'));
create policy dossiers_update on public.dossiers for update to authenticated
  using (public.has_permission('dossiers:write') or public.has_permission('dossiers:transition'))
  with check (public.has_permission('dossiers:write') or public.has_permission('dossiers:transition'));
create policy dossiers_delete on public.dossiers for delete to authenticated
  using (public.has_permission('dossiers:write'));

create policy sub_dossiers_select on public.sub_dossiers for select to authenticated using (public.has_permission('dossiers:read'));
create policy sub_dossiers_mutate on public.sub_dossiers for all to authenticated
  using (public.has_permission('dossiers:write')) with check (public.has_permission('dossiers:write'));

create policy dossier_fichiers_select on public.dossier_fichiers for select to authenticated using (public.has_permission('dossiers:read'));
create policy dossier_fichiers_mutate on public.dossier_fichiers for all to authenticated
  using (public.has_permission('dossiers:write')) with check (public.has_permission('dossiers:write'));

create policy dossier_comments_select on public.dossier_comments for select to authenticated using (public.has_permission('dossiers:read'));
create policy dossier_comments_mutate on public.dossier_comments for all to authenticated
  using (public.has_permission('dossiers:write')) with check (public.has_permission('dossiers:write'));

-- Fournisseurs
create policy fournisseurs_select on public.fournisseurs for select to authenticated using (public.has_permission('fournisseurs:read'));
create policy fournisseurs_mutate on public.fournisseurs for all to authenticated
  using (public.has_permission('fournisseurs:write')) with check (public.has_permission('fournisseurs:write'));

create policy dossier_fournisseurs_select on public.dossier_fournisseurs for select to authenticated using (public.has_permission('fournisseurs:read') or public.has_permission('dossiers:read'));
create policy dossier_fournisseurs_mutate on public.dossier_fournisseurs for all to authenticated
  using (public.has_permission('fournisseurs:write') or public.has_permission('dossiers:write'))
  with check (public.has_permission('fournisseurs:write') or public.has_permission('dossiers:write'));

-- Comptabilité
create policy ecritures_select on public.ecritures for select to authenticated using (public.has_permission('comptabilite:read'));
create policy ecritures_mutate on public.ecritures for all to authenticated
  using (public.has_permission('comptabilite:write')) with check (public.has_permission('comptabilite:write'));

-- Stock
create policy stock_items_select on public.stock_items for select to authenticated using (public.has_permission('stock:read'));
create policy stock_items_mutate on public.stock_items for all to authenticated
  using (public.has_permission('stock:write')) with check (public.has_permission('stock:write'));

create policy mouvements_select on public.mouvements for select to authenticated using (public.has_permission('stock:read'));
create policy mouvements_mutate on public.mouvements for all to authenticated
  using (public.has_permission('stock:write')) with check (public.has_permission('stock:write'));

-- Bons de sortie
create policy bons_select on public.bons_sortie for select to authenticated using (public.has_permission('bons:read'));
create policy bons_mutate on public.bons_sortie for all to authenticated
  using (public.has_permission('bons:write')) with check (public.has_permission('bons:write'));

-- Devis
create policy devis_select on public.devis for select to authenticated using (public.has_permission('devis:read'));
create policy devis_mutate on public.devis for all to authenticated
  using (public.has_permission('devis:write')) with check (public.has_permission('devis:write'));

-- Transporteurs
create policy transporteurs_select on public.transporteurs for select to authenticated using (public.has_permission('transporteurs:read'));
create policy transporteurs_mutate on public.transporteurs for all to authenticated
  using (public.has_permission('transporteurs:write')) with check (public.has_permission('transporteurs:write'));

-- Factures
create policy factures_select on public.factures for select to authenticated using (public.has_permission('factures:read'));
create policy factures_mutate on public.factures for all to authenticated
  using (public.has_permission('factures:write')) with check (public.has_permission('factures:write'));

create policy facture_lignes_select on public.facture_lignes for select to authenticated using (public.has_permission('factures:read'));
create policy facture_lignes_mutate on public.facture_lignes for all to authenticated
  using (public.has_permission('factures:write')) with check (public.has_permission('factures:write'));

-- Audit : lecture admin/paramètres, insertion seule pour utilisateurs actifs
create policy audit_logs_select on public.audit_logs for select to authenticated
  using (public.has_permission('parametres:read') or public.is_admin());
create policy audit_logs_insert on public.audit_logs for insert to authenticated
  with check (public.user_is_active());
create policy audit_logs_delete on public.audit_logs for delete to authenticated
  using (public.is_admin());

-- F-ANNEXE — Cloisonnement RLS par annexe. Reprend les policies posées par
-- 20260710_rls_permissions.sql (+ 20260714/20260721 pour bons_sortie_caisse)
-- et leur ajoute `has_annexe_access(annexe_id)` en plus du check de
-- permission déjà en place. Les tables enfants sans colonne annexe_id
-- propre (facture_lignes, sub_dossiers, dossier_fichiers, dossier_comments,
-- dossier_fournisseurs, bons_sortie_caisse_lignes) sont scopées par jointure
-- vers leur parent — sans ça, restreindre la table parente laisserait un
-- trou (ex. lire les lignes d'une facture d'une autre annexe).

-- Clients
drop policy if exists clients_select on public.clients;
drop policy if exists clients_insert on public.clients;
drop policy if exists clients_update on public.clients;
drop policy if exists clients_delete on public.clients;

create policy clients_select on public.clients for select to authenticated
  using (public.has_permission('clients:read') and public.has_annexe_access(annexe_id));
create policy clients_insert on public.clients for insert to authenticated
  with check (public.has_permission('clients:write') and public.has_annexe_access(annexe_id));
create policy clients_update on public.clients for update to authenticated
  using (public.has_permission('clients:write') and public.has_annexe_access(annexe_id))
  with check (public.has_permission('clients:write') and public.has_annexe_access(annexe_id));
create policy clients_delete on public.clients for delete to authenticated
  using (public.has_permission('clients:write') and public.has_annexe_access(annexe_id));

-- Dossiers
drop policy if exists dossiers_select on public.dossiers;
drop policy if exists dossiers_insert on public.dossiers;
drop policy if exists dossiers_update on public.dossiers;
drop policy if exists dossiers_delete on public.dossiers;

create policy dossiers_select on public.dossiers for select to authenticated
  using (public.has_permission('dossiers:read') and public.has_annexe_access(annexe_id));
create policy dossiers_insert on public.dossiers for insert to authenticated
  with check (public.has_permission('dossiers:write') and public.has_annexe_access(annexe_id));
create policy dossiers_update on public.dossiers for update to authenticated
  using (
    (public.has_permission('dossiers:write') or public.has_permission('dossiers:transition'))
    and public.has_annexe_access(annexe_id)
  )
  with check (
    (public.has_permission('dossiers:write') or public.has_permission('dossiers:transition'))
    and public.has_annexe_access(annexe_id)
  );
create policy dossiers_delete on public.dossiers for delete to authenticated
  using (public.has_permission('dossiers:write') and public.has_annexe_access(annexe_id));

-- Sub-dossiers / fichiers / commentaires / fournisseurs de dossier — scopés
-- par jointure vers dossiers.annexe_id (pas de colonne propre).
drop policy if exists sub_dossiers_select on public.sub_dossiers;
drop policy if exists sub_dossiers_mutate on public.sub_dossiers;
create policy sub_dossiers_select on public.sub_dossiers for select to authenticated
  using (
    public.has_permission('dossiers:read')
    and exists (select 1 from public.dossiers d where d.id = sub_dossiers.dossier_id and public.has_annexe_access(d.annexe_id))
  );
create policy sub_dossiers_mutate on public.sub_dossiers for all to authenticated
  using (
    public.has_permission('dossiers:write')
    and exists (select 1 from public.dossiers d where d.id = sub_dossiers.dossier_id and public.has_annexe_access(d.annexe_id))
  )
  with check (
    public.has_permission('dossiers:write')
    and exists (select 1 from public.dossiers d where d.id = sub_dossiers.dossier_id and public.has_annexe_access(d.annexe_id))
  );

drop policy if exists dossier_fichiers_select on public.dossier_fichiers;
drop policy if exists dossier_fichiers_mutate on public.dossier_fichiers;
create policy dossier_fichiers_select on public.dossier_fichiers for select to authenticated
  using (
    public.has_permission('dossiers:read')
    and exists (select 1 from public.dossiers d where d.id = dossier_fichiers.dossier_id and public.has_annexe_access(d.annexe_id))
  );
create policy dossier_fichiers_mutate on public.dossier_fichiers for all to authenticated
  using (
    public.has_permission('dossiers:write')
    and exists (select 1 from public.dossiers d where d.id = dossier_fichiers.dossier_id and public.has_annexe_access(d.annexe_id))
  )
  with check (
    public.has_permission('dossiers:write')
    and exists (select 1 from public.dossiers d where d.id = dossier_fichiers.dossier_id and public.has_annexe_access(d.annexe_id))
  );

drop policy if exists dossier_comments_select on public.dossier_comments;
drop policy if exists dossier_comments_mutate on public.dossier_comments;
create policy dossier_comments_select on public.dossier_comments for select to authenticated
  using (
    public.has_permission('dossiers:read')
    and exists (select 1 from public.dossiers d where d.id = dossier_comments.dossier_id and public.has_annexe_access(d.annexe_id))
  );
create policy dossier_comments_mutate on public.dossier_comments for all to authenticated
  using (
    public.has_permission('dossiers:write')
    and exists (select 1 from public.dossiers d where d.id = dossier_comments.dossier_id and public.has_annexe_access(d.annexe_id))
  )
  with check (
    public.has_permission('dossiers:write')
    and exists (select 1 from public.dossiers d where d.id = dossier_comments.dossier_id and public.has_annexe_access(d.annexe_id))
  );

drop policy if exists dossier_fournisseurs_select on public.dossier_fournisseurs;
drop policy if exists dossier_fournisseurs_mutate on public.dossier_fournisseurs;
create policy dossier_fournisseurs_select on public.dossier_fournisseurs for select to authenticated
  using (
    (public.has_permission('fournisseurs:read') or public.has_permission('dossiers:read'))
    and exists (select 1 from public.dossiers d where d.id = dossier_fournisseurs.dossier_id and public.has_annexe_access(d.annexe_id))
  );
create policy dossier_fournisseurs_mutate on public.dossier_fournisseurs for all to authenticated
  using (
    (public.has_permission('fournisseurs:write') or public.has_permission('dossiers:write'))
    and exists (select 1 from public.dossiers d where d.id = dossier_fournisseurs.dossier_id and public.has_annexe_access(d.annexe_id))
  )
  with check (
    (public.has_permission('fournisseurs:write') or public.has_permission('dossiers:write'))
    and exists (select 1 from public.dossiers d where d.id = dossier_fournisseurs.dossier_id and public.has_annexe_access(d.annexe_id))
  );

-- Comptabilité
drop policy if exists ecritures_select on public.ecritures;
drop policy if exists ecritures_mutate on public.ecritures;
create policy ecritures_select on public.ecritures for select to authenticated
  using (public.has_permission('comptabilite:read') and public.has_annexe_access(annexe_id));
create policy ecritures_mutate on public.ecritures for all to authenticated
  using (public.has_permission('comptabilite:write') and public.has_annexe_access(annexe_id))
  with check (public.has_permission('comptabilite:write') and public.has_annexe_access(annexe_id));

-- Stock
drop policy if exists stock_items_select on public.stock_items;
drop policy if exists stock_items_mutate on public.stock_items;
create policy stock_items_select on public.stock_items for select to authenticated
  using (public.has_permission('stock:read') and public.has_annexe_access(annexe_id));
create policy stock_items_mutate on public.stock_items for all to authenticated
  using (public.has_permission('stock:write') and public.has_annexe_access(annexe_id))
  with check (public.has_permission('stock:write') and public.has_annexe_access(annexe_id));

drop policy if exists mouvements_select on public.mouvements;
drop policy if exists mouvements_mutate on public.mouvements;
create policy mouvements_select on public.mouvements for select to authenticated
  using (public.has_permission('stock:read') and public.has_annexe_access(annexe_id));
create policy mouvements_mutate on public.mouvements for all to authenticated
  using (public.has_permission('stock:write') and public.has_annexe_access(annexe_id))
  with check (public.has_permission('stock:write') and public.has_annexe_access(annexe_id));

-- Bons de sortie (marchandise)
drop policy if exists bons_select on public.bons_sortie;
drop policy if exists bons_mutate on public.bons_sortie;
create policy bons_select on public.bons_sortie for select to authenticated
  using (public.has_permission('bons:read') and public.has_annexe_access(annexe_id));
create policy bons_mutate on public.bons_sortie for all to authenticated
  using (public.has_permission('bons:write') and public.has_annexe_access(annexe_id))
  with check (public.has_permission('bons:write') and public.has_annexe_access(annexe_id));

-- Bons de sortie de caisse (décaissement)
drop policy if exists bons_sortie_caisse_select on public.bons_sortie_caisse;
drop policy if exists bons_sortie_caisse_mutate on public.bons_sortie_caisse;
create policy bons_sortie_caisse_select on public.bons_sortie_caisse for select to authenticated
  using (public.has_permission('bons:read') and public.has_annexe_access(annexe_id));
create policy bons_sortie_caisse_mutate on public.bons_sortie_caisse for all to authenticated
  using (public.has_permission('bons:write-caisse') and public.has_annexe_access(annexe_id))
  with check (public.has_permission('bons:write-caisse') and public.has_annexe_access(annexe_id));

drop policy if exists bons_sortie_caisse_lignes_select on public.bons_sortie_caisse_lignes;
drop policy if exists bons_sortie_caisse_lignes_mutate on public.bons_sortie_caisse_lignes;
create policy bons_sortie_caisse_lignes_select on public.bons_sortie_caisse_lignes for select to authenticated
  using (
    public.has_permission('bons:read')
    and exists (select 1 from public.bons_sortie_caisse b where b.id = bons_sortie_caisse_lignes.bon_id and public.has_annexe_access(b.annexe_id))
  );
create policy bons_sortie_caisse_lignes_mutate on public.bons_sortie_caisse_lignes for all to authenticated
  using (
    public.has_permission('bons:write-caisse')
    and exists (select 1 from public.bons_sortie_caisse b where b.id = bons_sortie_caisse_lignes.bon_id and public.has_annexe_access(b.annexe_id))
  )
  with check (
    public.has_permission('bons:write-caisse')
    and exists (select 1 from public.bons_sortie_caisse b where b.id = bons_sortie_caisse_lignes.bon_id and public.has_annexe_access(b.annexe_id))
  );

-- Factures
drop policy if exists factures_select on public.factures;
drop policy if exists factures_mutate on public.factures;
create policy factures_select on public.factures for select to authenticated
  using (public.has_permission('factures:read') and public.has_annexe_access(annexe_id));
create policy factures_mutate on public.factures for all to authenticated
  using (public.has_permission('factures:write') and public.has_annexe_access(annexe_id))
  with check (public.has_permission('factures:write') and public.has_annexe_access(annexe_id));

drop policy if exists facture_lignes_select on public.facture_lignes;
drop policy if exists facture_lignes_mutate on public.facture_lignes;
create policy facture_lignes_select on public.facture_lignes for select to authenticated
  using (
    public.has_permission('factures:read')
    and exists (select 1 from public.factures f where f.id = facture_lignes.facture_id and public.has_annexe_access(f.annexe_id))
  );
create policy facture_lignes_mutate on public.facture_lignes for all to authenticated
  using (
    public.has_permission('factures:write')
    and exists (select 1 from public.factures f where f.id = facture_lignes.facture_id and public.has_annexe_access(f.annexe_id))
  )
  with check (
    public.has_permission('factures:write')
    and exists (select 1 from public.factures f where f.id = facture_lignes.facture_id and public.has_annexe_access(f.annexe_id))
  );

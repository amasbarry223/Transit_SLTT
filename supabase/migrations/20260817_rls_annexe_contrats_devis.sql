-- I3 — Cloisonnement RLS par annexe pour contrats / devis / fournisseurs / transporteurs
-- (+ colonnes annexe_id manquantes) et tables enfants de contrats.

do $$
declare
  t text;
begin
  foreach t in array array['contrats', 'devis', 'fournisseurs', 'transporteurs']
  loop
    execute format(
      'alter table public.%I add column if not exists annexe_id uuid references public.annexes(id) default %L',
      t, '33333333-3333-3333-3333-333333333333'
    );
    execute format(
      'update public.%I set annexe_id = %L where annexe_id is null',
      t, '33333333-3333-3333-3333-333333333333'
    );
    execute format('alter table public.%I alter column annexe_id set not null', t);
    execute format('create index if not exists %I on public.%I (annexe_id)', 'idx_' || t || '_annexe_id', t);
  end loop;
end $$;

-- Contrats
drop policy if exists contrats_select on public.contrats;
drop policy if exists contrats_mutate on public.contrats;
create policy contrats_select on public.contrats for select to authenticated
  using (public.has_permission('contrats:read') and public.has_annexe_access(annexe_id));
create policy contrats_mutate on public.contrats for all to authenticated
  using (public.has_permission('contrats:write') and public.has_annexe_access(annexe_id))
  with check (public.has_permission('contrats:write') and public.has_annexe_access(annexe_id));

-- Enfants contrats (jointure)
drop policy if exists contrat_fichiers_select on public.contrat_fichiers;
drop policy if exists contrat_fichiers_mutate on public.contrat_fichiers;
create policy contrat_fichiers_select on public.contrat_fichiers for select to authenticated
  using (
    public.has_permission('contrats:read')
    and exists (select 1 from public.contrats c where c.id = contrat_fichiers.contrat_id and public.has_annexe_access(c.annexe_id))
  );
create policy contrat_fichiers_mutate on public.contrat_fichiers for all to authenticated
  using (
    public.has_permission('contrats:write')
    and exists (select 1 from public.contrats c where c.id = contrat_fichiers.contrat_id and public.has_annexe_access(c.annexe_id))
  )
  with check (
    public.has_permission('contrats:write')
    and exists (select 1 from public.contrats c where c.id = contrat_fichiers.contrat_id and public.has_annexe_access(c.annexe_id))
  );

drop policy if exists contrat_prestations_select on public.contrat_prestations;
drop policy if exists contrat_prestations_mutate on public.contrat_prestations;
create policy contrat_prestations_select on public.contrat_prestations for select to authenticated
  using (
    public.has_permission('contrats:read')
    and exists (select 1 from public.contrats c where c.id = contrat_prestations.contrat_id and public.has_annexe_access(c.annexe_id))
  );
create policy contrat_prestations_mutate on public.contrat_prestations for all to authenticated
  using (
    public.has_permission('contrats:write')
    and exists (select 1 from public.contrats c where c.id = contrat_prestations.contrat_id and public.has_annexe_access(c.annexe_id))
  )
  with check (
    public.has_permission('contrats:write')
    and exists (select 1 from public.contrats c where c.id = contrat_prestations.contrat_id and public.has_annexe_access(c.annexe_id))
  );

drop policy if exists depenses_select on public.depenses;
drop policy if exists depenses_mutate on public.depenses;
create policy depenses_select on public.depenses for select to authenticated
  using (
    public.has_permission('contrats:read')
    and exists (select 1 from public.contrats c where c.id = depenses.contrat_id and public.has_annexe_access(c.annexe_id))
  );
create policy depenses_mutate on public.depenses for all to authenticated
  using (
    public.has_permission('contrats:write')
    and exists (select 1 from public.contrats c where c.id = depenses.contrat_id and public.has_annexe_access(c.annexe_id))
  )
  with check (
    public.has_permission('contrats:write')
    and exists (select 1 from public.contrats c where c.id = depenses.contrat_id and public.has_annexe_access(c.annexe_id))
  );

-- Devis
drop policy if exists devis_select on public.devis;
drop policy if exists devis_mutate on public.devis;
create policy devis_select on public.devis for select to authenticated
  using (public.has_permission('devis:read') and public.has_annexe_access(annexe_id));
create policy devis_mutate on public.devis for all to authenticated
  using (public.has_permission('devis:write') and public.has_annexe_access(annexe_id))
  with check (public.has_permission('devis:write') and public.has_annexe_access(annexe_id));

-- Fournisseurs
drop policy if exists fournisseurs_select on public.fournisseurs;
drop policy if exists fournisseurs_mutate on public.fournisseurs;
create policy fournisseurs_select on public.fournisseurs for select to authenticated
  using (public.has_permission('fournisseurs:read') and public.has_annexe_access(annexe_id));
create policy fournisseurs_mutate on public.fournisseurs for all to authenticated
  using (public.has_permission('fournisseurs:write') and public.has_annexe_access(annexe_id))
  with check (public.has_permission('fournisseurs:write') and public.has_annexe_access(annexe_id));

-- Transporteurs
drop policy if exists transporteurs_select on public.transporteurs;
drop policy if exists transporteurs_mutate on public.transporteurs;
create policy transporteurs_select on public.transporteurs for select to authenticated
  using (public.has_permission('transporteurs:read') and public.has_annexe_access(annexe_id));
create policy transporteurs_mutate on public.transporteurs for all to authenticated
  using (public.has_permission('transporteurs:write') and public.has_annexe_access(annexe_id))
  with check (public.has_permission('transporteurs:write') and public.has_annexe_access(annexe_id));

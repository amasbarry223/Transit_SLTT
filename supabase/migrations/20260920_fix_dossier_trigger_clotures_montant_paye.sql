-- Audit exhaustif du 2026-09-01 — corrige 3 fonctions/triggers encore
-- désynchronisés du schéma mono-société (societe_id dropé par
-- 20260915_sltt_mono_societe.sql, dans la même veine que
-- 20260919_fix_rpc_societe_id_drop.sql), une faille RLS annexe/dossier, et
-- réconcilie deux mécanismes qui écrasaient dossiers.montant_paye au lieu de
-- l'additionner (décision produit : les deux canaux de paiement — RPC
-- "Solder ce dossier" via ecritures, et lien Comptabilité générale via
-- operations_comptables — doivent s'additionner).

-- ---------------------------------------------------------------------------
-- 1. restrict_dossier_transition_columns() : retire societe_id (dropé).
--    Trigger BEFORE UPDATE non filtré sur dossiers — plantait sur CHAQUE
--    update pour un rôle sans dossiers:write (ex. Comptable).
-- ---------------------------------------------------------------------------
create or replace function public.restrict_dossier_transition_columns()
returns trigger
language plpgsql
as $$
begin
  if public.has_permission('dossiers:write') then
    return new;
  end if;
  -- Sync paiements écritures → dossier
  if public.has_permission('comptabilite:write')
     and new.montant_paye is distinct from old.montant_paye
     and new.statut is not distinct from old.statut
     and new.client_id is not distinct from old.client_id
  then
    return new;
  end if;
  if public.has_permission('dossiers:transition') then
    if new.client_id is distinct from old.client_id
      or new.bl is distinct from old.bl
      or new.nature is distinct from old.nature
      or new.camion is distinct from old.camion
      or new.montant_investi is distinct from old.montant_investi
      or coalesce(new.reference, '') is distinct from coalesce(old.reference, '')
      or (new.montant_paye is distinct from old.montant_paye and new.statut is not distinct from old.statut)
    then
      raise exception 'dossiers:transition ne permet de modifier que le statut (et le paiement associé à la transition)';
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. clotures_caisse : societe_id dropé, mais entite_key (colonne générée)
--    en dépend — un DROP COLUMN sans CASCADE a dû échouer sur cette table
--    précise si 20260915 avait déjà tourné. IF EXISTS/CASCADE partout : sûr
--    que la colonne soit encore là ou déjà partie. Purge d'abord les lignes
--    "societe" historiques (Top Doumani, déjà supprimé partout ailleurs).
--    Idempotent : si la base live a déjà migré vers annexe-only (sans
--    entite_type), cette section ne fait rien de destructif.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'clotures_caisse'
      and column_name = 'entite_type'
  ) then
    delete from public.clotures_caisse where entite_type = 'societe';

    alter table public.clotures_caisse drop constraint if exists clotures_caisse_entite_coherente;
    alter table public.clotures_caisse drop column if exists societe_id cascade;

    alter table public.clotures_caisse
      add column if not exists entite_key text generated always as (entite_type || ':' || annexe_id::text) stored;

    if not exists (
      select 1 from pg_constraint
      where conrelid = 'public.clotures_caisse'::regclass
        and contype = 'u'
    ) then
      alter table public.clotures_caisse
        add constraint clotures_caisse_entite_key_periode_fin_key unique (entite_key, periode_fin);
    end if;

    alter table public.clotures_caisse
      add constraint clotures_caisse_entite_coherente check (entite_type = 'annexe' and annexe_id is not null);
  else
    alter table public.clotures_caisse drop column if exists societe_id cascade;
  end if;
end $$;

-- record_cloture_caisse() : ne remplace la signature legacy (p_entite_type…)
-- que si elle est encore présente ; la signature annexe-only (p_annexe_id…)
-- utilisée par l'app reste inchangée.
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'record_cloture_caisse'
      and pg_get_function_identity_arguments(p.oid) like 'p_entite_type%'
  ) then
    execute $fn$
      create or replace function public.record_cloture_caisse(
        p_entite_type text,
        p_periode_debut date,
        p_periode_fin date,
        p_solde_theorique numeric,
        p_solde_constate numeric,
        p_annexe_id uuid default null,
        p_societe_id uuid default null,
        p_note text default null
      )
      returns public.clotures_caisse
      language plpgsql
      security definer
      set search_path = public
      as $body$
      declare
        v_cloture public.clotures_caisse%rowtype;
        v_user text;
      begin
        if not public.has_permission('comptabilite:write') then
          raise exception 'Permission comptabilite:write requise';
        end if;
        if p_entite_type <> 'annexe' then
          raise exception 'Seules les clôtures par annexe sont supportées';
        end if;
        if p_annexe_id is null then
          raise exception 'Clôture annexe : annexe_id requis';
        end if;
        if not public.has_annexe_access(p_annexe_id) then
          raise exception 'Annexe hors de votre périmètre';
        end if;
        if p_periode_debut is null or p_periode_fin is null or p_periode_fin < p_periode_debut then
          raise exception 'Période de clôture invalide';
        end if;

        select coalesce(p.nom, 'Système') into v_user
        from public.profiles p where p.id = auth.uid();

        insert into public.clotures_caisse (
          entite_type, annexe_id, periode_debut, periode_fin,
          solde_theorique, solde_constate, note, cloture_par, cloture_le
        ) values (
          p_entite_type, p_annexe_id, p_periode_debut, p_periode_fin,
          coalesce(p_solde_theorique, 0), coalesce(p_solde_constate, 0),
          nullif(p_note, ''), coalesce(v_user, 'Système'), now()
        )
        on conflict (entite_key, periode_fin) do update set
          periode_debut = excluded.periode_debut,
          solde_theorique = excluded.solde_theorique,
          solde_constate = excluded.solde_constate,
          note = excluded.note,
          cloture_par = excluded.cloture_par,
          cloture_le = excluded.cloture_le
        returning * into v_cloture;

        return v_cloture;
      end;
      $body$;
    $fn$;

    revoke all on function public.record_cloture_caisse(text, date, date, numeric, numeric, uuid, uuid, text) from public, anon;
    grant execute on function public.record_cloture_caisse(text, date, date, numeric, numeric, uuid, uuid, text) to authenticated;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Montant payé dossier additif (ecritures + operations_comptables) — les
--    3 sites qui écrivaient dossiers.montant_paye s'écrasaient l'un l'autre
--    (le dernier à s'exécuter effaçait la contribution de l'autre canal).
--    Fonction partagée pour éviter toute dérive future entre les 3 sites.
-- ---------------------------------------------------------------------------
create or replace function public.compute_dossier_montant_paye(p_dossier_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((select sum(e.montant_paye) from public.ecritures e where e.dossier_id = p_dossier_id), 0)
    + coalesce((
        select sum(case when oc.type = 'Entrée' then oc.montant else -oc.montant end)
        from public.operations_comptables oc
        where oc.dossier_id = p_dossier_id
      ), 0);
$$;

revoke all on function public.compute_dossier_montant_paye(uuid) from public, anon;
grant execute on function public.compute_dossier_montant_paye(uuid) to authenticated;

-- 3a. sync_dossier_montant_paye_from_operations() : additif au lieu d'écraser.
create or replace function public.sync_dossier_montant_paye_from_operations()
returns trigger as $$
declare
  v_dossier_id uuid;
  v_total_paye numeric;
  v_montant_investi numeric;
  v_statut_actuel text;
begin
  if tg_op = 'DELETE' then
    v_dossier_id := old.dossier_id;
  else
    v_dossier_id := new.dossier_id;
  end if;

  if v_dossier_id is null then
    return null;
  end if;

  v_total_paye := greatest(0, public.compute_dossier_montant_paye(v_dossier_id));

  select montant_investi, statut
  into v_montant_investi, v_statut_actuel
  from public.dossiers
  where id = v_dossier_id;

  update public.dossiers
  set montant_paye = v_total_paye,
      statut = case
        when v_total_paye >= montant_investi and v_montant_investi > 0 and v_statut_actuel in ('En cours', 'Dédouané', 'Livré') then 'Soldé'
        else v_statut_actuel
      end,
      updated_at = now()
  where id = v_dossier_id;

  return null;
end;
$$ language plpgsql security definer set search_path = public;

-- 3b. record_dossier_solde_paiement() : le total final inclut aussi operations_comptables.
create or replace function public.record_dossier_solde_paiement(
  p_dossier_id uuid,
  p_montant numeric,
  p_mode text default null,
  p_date date default null,
  p_note text default null
)
returns table (
  dossier_montant_paye numeric,
  ecriture_id uuid,
  ecriture_montant_paye numeric,
  ecriture_mode_paiement text,
  ecriture_date_paiement date,
  ecriture_note text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  d public.dossiers%rowtype;
  e public.ecritures%rowtype;
  v_new_ecriture_paye numeric;
  v_dossier_paye numeric;
  v_investi numeric;
begin
  if not (public.has_permission('dossiers:transition') or public.has_permission('dossiers:write')) then
    raise exception 'Permission dossiers:transition requise';
  end if;
  if p_montant is null or p_montant <= 0 then
    raise exception 'Montant de paiement invalide';
  end if;

  select * into d from public.dossiers where id = p_dossier_id for update;
  if not found then
    raise exception 'Dossier introuvable';
  end if;
  if not public.has_annexe_access(d.annexe_id) then
    raise exception 'Dossier hors de votre périmètre d''annexe';
  end if;
  if d.statut <> 'Livré' then
    raise exception 'Impossible de solder un dossier %', d.statut;
  end if;

  v_investi := coalesce(d.montant_investi, 0);
  if p_montant < greatest(0, v_investi - coalesce(d.montant_paye, 0)) then
    raise exception 'Le paiement (%) doit couvrir le solde dû (%)',
      p_montant, greatest(0, v_investi - coalesce(d.montant_paye, 0));
  end if;

  select * into e from public.ecritures where dossier_id = p_dossier_id order by id for update limit 1;

  if found then
    v_new_ecriture_paye := least(
      coalesce(e.montant_investi, d.montant_investi, 0),
      greatest(0, coalesce(e.montant_paye, 0) + p_montant)
    );
    update public.ecritures
    set
      montant_paye = v_new_ecriture_paye,
      mode_paiement = coalesce(p_mode, e.mode_paiement),
      date_paiement = coalesce(p_date, e.date_paiement, current_date),
      note = coalesce(nullif(p_note, ''), e.note)
    where id = e.id
    returning * into e;
  else
    insert into public.ecritures (
      date, date_paiement, client_id, dossier_id, annexe_id,
      montant_investi, montant_paye, mode_paiement, note
    ) values (
      current_date,
      coalesce(p_date, current_date),
      d.client_id,
      d.id,
      d.annexe_id,
      d.montant_investi,
      least(d.montant_investi, greatest(0, p_montant)),
      coalesce(p_mode, 'Espèces'),
      coalesce(nullif(p_note, ''), 'Solde dossier ' || d.reference)
    )
    returning * into e;
  end if;

  v_dossier_paye := greatest(0, public.compute_dossier_montant_paye(p_dossier_id));

  if v_dossier_paye < v_investi then
    raise exception 'Solde dossier impossible : reste dû % FCFA', (v_investi - v_dossier_paye);
  end if;

  perform set_config('sltt.internal_dossier_solde', '1', true);

  update public.dossiers
  set statut = 'Soldé', montant_paye = v_dossier_paye
  where id = p_dossier_id;

  return query
    select v_dossier_paye, e.id, e.montant_paye, e.mode_paiement, e.date_paiement, e.note;
end;
$$;

revoke all on function public.record_dossier_solde_paiement(uuid, numeric, text, date, text) from public, anon;
grant execute on function public.record_dossier_solde_paiement(uuid, numeric, text, date, text) to authenticated;

-- 3c. record_ecriture_paiement() : sync dossier additive elle aussi.
create or replace function public.record_ecriture_paiement(
  p_ecriture_id uuid,
  p_montant numeric,
  p_mode text,
  p_date date,
  p_note text default null
)
returns public.ecritures
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.ecritures%rowtype;
  v_new_paye numeric;
begin
  if not public.has_permission('comptabilite:write') then
    raise exception 'Permission comptabilite:write requise';
  end if;
  if p_montant is null or p_montant <= 0 then
    raise exception 'Montant de paiement invalide';
  end if;

  select * into e from public.ecritures where id = p_ecriture_id for update;
  if not found then
    raise exception 'Écriture introuvable';
  end if;
  if not public.has_annexe_access(e.annexe_id) then
    raise exception 'Écriture hors de votre périmètre d''annexe';
  end if;

  v_new_paye := least(
    coalesce(e.montant_investi, 0),
    greatest(0, coalesce(e.montant_paye, 0) + p_montant)
  );

  update public.ecritures
  set
    montant_paye = v_new_paye,
    mode_paiement = coalesce(p_mode, e.mode_paiement),
    date_paiement = coalesce(p_date, e.date_paiement),
    note = coalesce(nullif(p_note, ''), e.note)
  where id = p_ecriture_id
  returning * into e;

  if e.dossier_id is not null then
    update public.dossiers d
    set montant_paye = greatest(0, public.compute_dossier_montant_paye(e.dossier_id))
    where d.id = e.dossier_id;
  end if;

  return e;
end;
$$;

revoke all on function public.record_ecriture_paiement(uuid, numeric, text, date, text) from public, anon;
grant execute on function public.record_ecriture_paiement(uuid, numeric, text, date, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. operations_comptables_mutate : vérifie aussi l'annexe du dossier lié —
--    sans ça, un comptable scopé Annexe A peut lier une opération à un
--    dossier de l'Annexe B (UUID connu/deviné) et muter son solde via le
--    trigger de synchro, en contournant le RLS dossiers.
-- ---------------------------------------------------------------------------
drop policy if exists operations_comptables_mutate on public.operations_comptables;
create policy operations_comptables_mutate on public.operations_comptables for all to authenticated
  using (
    public.has_permission('comptabilite:write')
    and public.has_annexe_access(annexe_id)
    and (
      dossier_id is null
      or exists (select 1 from public.dossiers d where d.id = dossier_id and public.has_annexe_access(d.annexe_id))
    )
  )
  with check (
    public.has_permission('comptabilite:write')
    and public.has_annexe_access(annexe_id)
    and (
      dossier_id is null
      or exists (select 1 from public.dossiers d where d.id = dossier_id and public.has_annexe_access(d.annexe_id))
    )
  );

-- ---------------------------------------------------------------------------
-- 5. Réapplique 20260916_harden_users_audit_security.sql à l'identique, avec
--    la bonne signature record_cloture_caisse (la version originale
--    référençait (uuid, date, date, numeric, numeric, text) — 6 paramètres,
--    alors que la vraie signature en a 8 dont le 1er est `text` — cette
--    ligne levait "function does not exist", ce qui a probablement fait
--    échouer et annuler tout le reste du fichier si les migrations tournent
--    en transaction par fichier). Idempotent : sans risque si 20260916 avait
--    en fait réussi.
-- ---------------------------------------------------------------------------
drop view if exists public.profiles_public;

create view public.profiles_public
with (security_invoker = true) as
select id, nom, role, actif, derniere_connexion
from public.profiles;

revoke all on public.profiles_public from public, anon, authenticated;
grant select on public.profiles_public to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nom, email, role, permissions, actif)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'nom'), ''), new.email),
    new.email,
    'Agent de transit',
    '{}'::text[],
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.protect_profiles_sensitive_columns() from public, anon, authenticated;

drop policy if exists user_annexes_select on public.user_annexes;
create policy user_annexes_select on public.user_annexes
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.has_permission('utilisateurs:manage')
    or public.is_admin()
  );

alter table public.audit_logs
  add column if not exists user_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_audit_logs_user_id on public.audit_logs (user_id);

create or replace function public.audit_logs_bind_actor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nom text;
  v_actif boolean;
begin
  -- Inserts backend (service_role) : conserver user_name / user_id fournis.
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'Audit insert requires authentication' using errcode = '42501';
  end if;

  select p.nom, p.actif into v_nom, v_actif
  from public.profiles p
  where p.id = auth.uid();

  if v_nom is null or v_actif is not true then
    raise exception 'Audit insert requires an active profile' using errcode = '42501';
  end if;

  new.user_id := auth.uid();
  new.user_name := v_nom;
  return new;
end;
$$;

drop trigger if exists audit_logs_bind_actor on public.audit_logs;
create trigger audit_logs_bind_actor
  before insert on public.audit_logs
  for each row execute function public.audit_logs_bind_actor();

revoke all on function public.audit_logs_bind_actor() from public, anon, authenticated;

revoke all on function public.apply_stock_movement(uuid, numeric, text, text, text, text) from public, anon;
grant execute on function public.apply_stock_movement(uuid, numeric, text, text, text, text) to authenticated;

revoke all on function public.export_business_data() from public, anon;
grant execute on function public.export_business_data() to authenticated;

revoke all on function public.has_annexe_access(uuid) from public, anon;
grant execute on function public.has_annexe_access(uuid) to authenticated;

revoke all on function public.has_permission(text) from public, anon;
grant execute on function public.has_permission(text) to authenticated;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

revoke all on function public.link_devis_to_dossier(uuid, uuid) from public, anon;
grant execute on function public.link_devis_to_dossier(uuid, uuid) to authenticated;

revoke all on function public.list_business_tables() from public, anon;
grant execute on function public.list_business_tables() to authenticated;

revoke all on function public.next_document_version(uuid) from public, anon;
grant execute on function public.next_document_version(uuid) to authenticated;

revoke all on function public.next_recu_reference() from public, anon;
grant execute on function public.next_recu_reference() to authenticated;

revoke all on function public.patch_facture_montant_paye(uuid, numeric) from public, anon;
grant execute on function public.patch_facture_montant_paye(uuid, numeric) to authenticated;

revoke all on function public.profile_is_admin(uuid) from public, anon;
grant execute on function public.profile_is_admin(uuid) to authenticated;

revoke all on function public.record_dossier_solde_paiement(uuid, numeric, text, date, text) from public, anon;
grant execute on function public.record_dossier_solde_paiement(uuid, numeric, text, date, text) to authenticated;

revoke all on function public.record_ecriture_paiement(uuid, numeric, text, date, text) from public, anon;
grant execute on function public.record_ecriture_paiement(uuid, numeric, text, date, text) to authenticated;

revoke all on function public.record_facture_paiement(uuid, numeric) from public, anon;
grant execute on function public.record_facture_paiement(uuid, numeric) to authenticated;

revoke all on function public.replace_ocr_job_fields(uuid, text, text, text, jsonb) from public, anon;
grant execute on function public.replace_ocr_job_fields(uuid, text, text, text, jsonb) to authenticated;

revoke all on function public.replace_user_annexes(uuid, uuid[]) from public, anon;
grant execute on function public.replace_user_annexes(uuid, uuid[]) to authenticated;

revoke all on function public.restore_business_data(jsonb) from public, anon;
grant execute on function public.restore_business_data(jsonb) to authenticated;

revoke all on function public.sync_dossier_montant_paye_from_operations() from public, anon;
grant execute on function public.sync_dossier_montant_paye_from_operations() to authenticated;

revoke all on function public.user_annexe_ids() from public, anon;
grant execute on function public.user_annexe_ids() to authenticated;

revoke all on function public.user_is_active() from public, anon;
grant execute on function public.user_is_active() to authenticated;

revoke all on function public.validate_bon_sortie(uuid, text) from public, anon;
grant execute on function public.validate_bon_sortie(uuid, text) to authenticated;

revoke all on function public.wipe_business_data() from public, anon;
grant execute on function public.wipe_business_data() to authenticated;

notify pgrst, 'reload schema';

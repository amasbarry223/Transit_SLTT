-- Durcit utilisateurs / rôles / audit :
-- 1. profiles_public : security_invoker + SELECT-only (plus d'UPDATE qui contourne le RLS)
-- 2. handle_new_user : ignore user_metadata.role/permissions (user-éditables)
-- 3. user_annexes_select : plus de fuite via parametres:read
-- 4. audit_logs : user_id + trigger qui impose l'identité de auth.uid()
-- 5. REVOKE EXECUTE anon sur les RPC SECURITY DEFINER

-- ---------------------------------------------------------------------------
-- 1. Vue profiles_public
-- ---------------------------------------------------------------------------
drop view if exists public.profiles_public;

create view public.profiles_public
with (security_invoker = true) as
select id, nom, role, actif, derniere_connexion
from public.profiles;

revoke all on public.profiles_public from public, anon, authenticated;
grant select on public.profiles_public to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Provisioning profil : jamais de rôle/permissions depuis user_metadata
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 3. user_annexes : lecture limitée aux concernés
-- ---------------------------------------------------------------------------
drop policy if exists user_annexes_select on public.user_annexes;
create policy user_annexes_select on public.user_annexes
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.has_permission('utilisateurs:manage')
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 4. Audit : lier l'acteur à auth.uid()
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 5. RPC : retirer EXECUTE à anon / PUBLIC, garder authenticated pour l'app
-- ---------------------------------------------------------------------------
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

revoke all on function public.record_cloture_caisse(uuid, date, date, numeric, numeric, text) from public, anon;
grant execute on function public.record_cloture_caisse(uuid, date, date, numeric, numeric, text) to authenticated;

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

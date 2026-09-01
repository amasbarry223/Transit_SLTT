-- 20260915_sltt_mono_societe.sql a supprimé la colonne societe_id de
-- mouvements/stock_items/ecritures/dossiers (entre autres), mais les 3
-- fonctions RPC ci-dessous — dans leur dernière version trackée en
-- migration — référencent encore explicitement societe_id via un
-- %ROWTYPE de ces tables. Si cette RPC n'a pas déjà été corrigée à la
-- main (hors suivi de migration), chaque appel plante avec "record has
-- no field societe_id" : entrée/sortie de stock, validation d'un bon de
-- sortie, et le premier paiement soldant un dossier deviennent
-- impossibles. Ce fichier réaligne le corps des 3 fonctions sur le
-- schéma actuel — sans effet si elles étaient déjà corrigées (le
-- nouveau corps est alors identique à l'existant), corrige le problème
-- sinon. Signatures inchangées (mêmes paramètres), donc create or
-- replace suffit, pas de drop function nécessaire.

-- ---------------------------------------------------------------------------
-- 1. apply_stock_movement — cf. 20260827_apply_stock_movement_rpc.sql
-- ---------------------------------------------------------------------------
create or replace function public.apply_stock_movement(
  p_stock_id uuid,
  p_delta numeric,
  p_type text,
  p_responsable text,
  p_bon_ref text default null,
  p_motif text default null
)
returns table (
  stock_id uuid,
  stock_quantite numeric,
  mouvement_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.stock_items%rowtype;
  m public.mouvements%rowtype;
  v_resp text;
begin
  if not public.has_permission('stock:write') then
    raise exception 'Permission stock:write requise';
  end if;
  if p_type not in ('Entrée', 'Sortie') then
    raise exception 'Type de mouvement invalide: %', p_type;
  end if;
  if p_delta is null or p_delta = 0 then
    raise exception 'Quantité de mouvement invalide';
  end if;
  if (p_type = 'Entrée' and p_delta <= 0) or (p_type = 'Sortie' and p_delta >= 0) then
    raise exception 'Signe de la quantité incohérent avec le type de mouvement';
  end if;

  select * into s from public.stock_items where id = p_stock_id for update;
  if not found then
    raise exception 'Article de stock introuvable';
  end if;
  if not public.has_annexe_access(s.annexe_id) then
    raise exception 'Article de stock hors de votre périmètre d''annexe';
  end if;

  update public.stock_items
  set quantite = quantite + p_delta
  where id = p_stock_id and quantite + p_delta >= 0
  returning * into s;
  if not found then
    raise exception 'Stock insuffisant pour cette sortie';
  end if;

  v_resp := coalesce(nullif(p_responsable, ''), 'Système');

  insert into public.mouvements (
    stock_id, annexe_id, type, quantite, date, responsable, marchandise, unite, bon_ref, motif
  ) values (
    s.id, s.annexe_id, p_type, abs(p_delta), now(), v_resp, s.marchandise, s.unite, p_bon_ref, p_motif
  )
  returning * into m;

  return query select s.id, s.quantite, m.id;
end;
$$;

revoke all on function public.apply_stock_movement(uuid, numeric, text, text, text, text) from public, anon;
grant execute on function public.apply_stock_movement(uuid, numeric, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. validate_bon_sortie — cf. 20260910_validate_bon_sortie_returns_stock_quantite.sql
-- ---------------------------------------------------------------------------
create or replace function public.validate_bon_sortie(p_bon_id uuid, p_responsable text default null)
returns table (
  bon public.bons_sortie,
  mouvement_id uuid,
  stock_quantite numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.bons_sortie%rowtype;
  s public.stock_items%rowtype;
  m public.mouvements%rowtype;
  v_resp text;
begin
  if not public.has_permission('bons:write') then
    raise exception 'Permission bons:write requise';
  end if;

  select * into b from public.bons_sortie where id = p_bon_id for update;
  if not found then
    raise exception 'Bon introuvable';
  end if;
  if not public.has_annexe_access(b.annexe_id) then
    raise exception 'Bon hors de votre périmètre d''annexe';
  end if;
  if b.statut = 'Validé' then
    raise exception 'Bon déjà validé';
  end if;

  select * into s from public.stock_items where id = b.stock_id for update;
  if not found then
    raise exception 'Stock introuvable pour ce bon';
  end if;
  if coalesce(s.quantite, 0) < coalesce(b.quantite, 0) then
    raise exception 'Stock insuffisant (%) pour la quantité demandée (%)', s.quantite, b.quantite;
  end if;

  update public.stock_items
  set quantite = quantite - b.quantite
  where id = s.id
    and quantite >= b.quantite
  returning * into s;
  if not found then
    raise exception 'Stock insuffisant (course concurrente)';
  end if;

  v_resp := coalesce(nullif(p_responsable, ''), 'Système');

  insert into public.mouvements (
    stock_id, annexe_id, type, quantite, date, responsable, marchandise, unite, bon_ref
  ) values (
    s.id, s.annexe_id, 'Sortie', b.quantite, now(), v_resp, s.marchandise, s.unite, b.reference
  )
  returning * into m;

  perform set_config('sltt.internal_bon_validate', '1', true);

  update public.bons_sortie set statut = 'Validé' where id = b.id returning * into b;

  return query select b, m.id, s.quantite;
end;
$$;

revoke all on function public.validate_bon_sortie(uuid, text) from public, anon;
grant execute on function public.validate_bon_sortie(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. record_dossier_solde_paiement — cf. 20260904_audit_business_logic_hardening.sql
-- ---------------------------------------------------------------------------
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

  select coalesce(sum(ec.montant_paye), 0) into v_dossier_paye
  from public.ecritures ec
  where ec.dossier_id = p_dossier_id;

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

notify pgrst, 'reload schema';

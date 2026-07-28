-- Audit Sprint 1+2 : RPC atomiques paiements/stock + FSM transitions en DB

-- ---------------------------------------------------------------------------
-- Paiement facture atomique (évite double encaissement concurrent)
-- ---------------------------------------------------------------------------
create or replace function public.record_facture_paiement(
  p_facture_id uuid,
  p_montant numeric
)
returns public.factures
language plpgsql
security definer
set search_path = public
as $$
declare
  f public.factures%rowtype;
  v_reste numeric;
  v_effective numeric;
  v_new_paye numeric;
  v_new_statut text;
begin
  if not public.has_permission('factures:write') then
    raise exception 'Permission factures:write requise';
  end if;
  if p_montant is null or p_montant <= 0 then
    raise exception 'Montant de paiement invalide';
  end if;

  select * into f from public.factures where id = p_facture_id for update;
  if not found then
    raise exception 'Facture introuvable';
  end if;
  if f.statut in ('Brouillon', 'Annulée', 'Soldée') then
    raise exception 'Impossible d''enregistrer un paiement sur une facture %', f.statut;
  end if;

  v_reste := greatest(0, coalesce(f.montant_ttc, 0) - coalesce(f.montant_paye, 0));
  if p_montant > v_reste then
    raise exception 'Montant (%) supérieur au reste à payer (%)', p_montant, v_reste;
  end if;

  v_effective := p_montant;
  v_new_paye := least(coalesce(f.montant_ttc, 0), coalesce(f.montant_paye, 0) + v_effective);
  v_new_statut := case
    when v_new_paye >= coalesce(f.montant_ttc, 0) then 'Soldée'
    else 'Partielle'
  end;

  update public.factures
  set montant_paye = v_new_paye, statut = v_new_statut
  where id = p_facture_id
  returning * into f;

  return f;
end;
$$;

revoke all on function public.record_facture_paiement(uuid, numeric) from public;
grant execute on function public.record_facture_paiement(uuid, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- Paiement écriture atomique
-- ---------------------------------------------------------------------------
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

  -- Sync dossier.montant_paye si lié
  if e.dossier_id is not null then
    update public.dossiers d
    set montant_paye = coalesce((
      select sum(ec.montant_paye) from public.ecritures ec where ec.dossier_id = e.dossier_id
    ), 0)
    where d.id = e.dossier_id;
  end if;

  return e;
end;
$$;

revoke all on function public.record_ecriture_paiement(uuid, numeric, text, date, text) from public;
grant execute on function public.record_ecriture_paiement(uuid, numeric, text, date, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Validation bon + décrément stock atomique
-- ---------------------------------------------------------------------------
create or replace function public.validate_bon_sortie(p_bon_id uuid, p_responsable text default null)
returns public.bons_sortie
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.bons_sortie%rowtype;
  s public.stock_items%rowtype;
  v_resp text;
begin
  if not public.has_permission('bons:write') then
    raise exception 'Permission bons:write requise';
  end if;

  select * into b from public.bons_sortie where id = p_bon_id for update;
  if not found then
    raise exception 'Bon introuvable';
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
    and quantite >= b.quantite;
  if not found then
    raise exception 'Stock insuffisant (course concurrente)';
  end if;

  v_resp := coalesce(nullif(p_responsable, ''), 'Système');

  insert into public.mouvements (
    stock_id, societe_id, type, quantite, date, responsable, marchandise, unite, bon_ref
  ) values (
    s.id, s.societe_id, 'Sortie', b.quantite, now(), v_resp, s.marchandise, s.unite, b.reference
  );

  update public.bons_sortie set statut = 'Validé' where id = b.id returning * into b;
  return b;
end;
$$;

revoke all on function public.validate_bon_sortie(uuid, text) from public;
grant execute on function public.validate_bon_sortie(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- FSM : transitions devis / factures / dossiers / contrats
-- ---------------------------------------------------------------------------
create or replace function public.assert_devis_transition()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.statut is distinct from old.statut then
    if not (
      (old.statut = 'Brouillon' and new.statut in ('Envoyé', 'Refusé'))
      or (old.statut = 'Envoyé' and new.statut in ('Accepté', 'Refusé', 'Expiré'))
      or (old.statut = 'Refusé' and new.statut = 'Brouillon')
      or (old.statut = 'Expiré' and new.statut = 'Brouillon')
    ) then
      raise exception 'Transition devis invalide : % → %', old.statut, new.statut;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_devis_statut_fsm on public.devis;
create trigger trg_devis_statut_fsm
  before update of statut on public.devis
  for each row execute function public.assert_devis_transition();

create or replace function public.assert_facture_transition()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.statut is distinct from old.statut then
    -- Paiements RPC peuvent passer Envoyée/Partielle → Partielle/Soldée
    if not (
      (old.statut = 'Brouillon' and new.statut in ('Envoyée', 'Annulée'))
      or (old.statut = 'Envoyée' and new.statut in ('Partielle', 'Soldée', 'Annulée'))
      or (old.statut = 'Partielle' and new.statut in ('Soldée', 'Annulée', 'Partielle'))
      or (old.statut = 'Soldée' and new.statut = 'Annulée')
    ) then
      raise exception 'Transition facture invalide : % → %', old.statut, new.statut;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_facture_statut_fsm on public.factures;
create trigger trg_facture_statut_fsm
  before update of statut on public.factures
  for each row execute function public.assert_facture_transition();

create or replace function public.assert_dossier_transition()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.statut is distinct from old.statut then
    if not (
      (old.statut = 'En cours' and new.statut = 'Dédouané')
      or (old.statut = 'Dédouané' and new.statut = 'Livré')
      or (old.statut = 'Livré' and new.statut = 'Soldé')
    ) then
      raise exception 'Transition dossier invalide : % → %', old.statut, new.statut;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_dossier_statut_fsm on public.dossiers;
create trigger trg_dossier_statut_fsm
  before update of statut on public.dossiers
  for each row execute function public.assert_dossier_transition();

create or replace function public.assert_contrat_transition()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.statut is distinct from old.statut then
    if not (
      (old.statut = 'Actif' and new.statut in ('Suspendu', 'Clôturé'))
      or (old.statut = 'Suspendu' and new.statut in ('Actif', 'Clôturé'))
      or (old.statut = 'Clôturé' and new.statut = 'Actif')
    ) then
      raise exception 'Transition contrat invalide : % → %', old.statut, new.statut;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_contrat_statut_fsm on public.contrats;
create trigger trg_contrat_statut_fsm
  before update of statut on public.contrats
  for each row execute function public.assert_contrat_transition();

-- dossiers:transition ne peut modifier que statut (+ sync compta montant_paye)
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
     and new.societe_id is not distinct from old.societe_id
  then
    return new;
  end if;
  if public.has_permission('dossiers:transition') then
    if new.client_id is distinct from old.client_id
      or new.societe_id is distinct from old.societe_id
      or new.bl is distinct from old.bl
      or new.nature is distinct from old.nature
      or new.camion is distinct from old.camion
      or new.montant_investi is distinct from old.montant_investi
      or new.montant_paye is distinct from old.montant_paye
      or coalesce(new.reference, '') is distinct from coalesce(old.reference, '')
    then
      raise exception 'dossiers:transition ne permet de modifier que le statut';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_dossier_transition_columns on public.dossiers;
create trigger trg_dossier_transition_columns
  before update on public.dossiers
  for each row execute function public.restrict_dossier_transition_columns();

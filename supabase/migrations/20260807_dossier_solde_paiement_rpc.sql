-- Comble un trou du hardening RPC/FSM (20260804) : la transition dossier
-- "Livré → Soldé" avec encaissement calculait encore le nouveau montant_paye
-- côté client (lecture état local + Math.min/max) puis écrivait en direct
-- sur dossiers ET ecritures. Deux transitions concurrentes sur le même
-- dossier pouvaient donc s'écraser et faire perdre un paiement, exactement
-- le risque que record_facture_paiement / record_ecriture_paiement /
-- validate_bon_sortie ont fermé pour factures/écritures/stock.

-- ---------------------------------------------------------------------------
-- Solde dossier + paiement atomiques (verrou dossier + écriture, calcul en DB)
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
  if d.statut <> 'Livré' then
    raise exception 'Impossible de solder un dossier %', d.statut;
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
      date, date_paiement, client_id, dossier_id, societe_id,
      montant_investi, montant_paye, mode_paiement, note
    ) values (
      current_date,
      coalesce(p_date, current_date),
      d.client_id,
      d.id,
      d.societe_id,
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

  update public.dossiers
  set statut = 'Soldé', montant_paye = v_dossier_paye
  where id = p_dossier_id;

  return query
    select v_dossier_paye, e.id, e.montant_paye, e.mode_paiement, e.date_paiement, e.note;
end;
$$;

revoke all on function public.record_dossier_solde_paiement(uuid, numeric, text, date, text) from public;
grant execute on function public.record_dossier_solde_paiement(uuid, numeric, text, date, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Permet à dossiers:transition de faire évoluer montant_paye UNIQUEMENT
-- lorsque le statut change dans la même écriture (transition réelle, ex.
-- solde). Avant ce correctif, un rôle configuré avec dossiers:transition
-- seul (sans dossiers:write) se voyait bloqué par cette même fonction dès
-- que record_dossier_solde_paiement touchait montant_paye + statut.
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
      or coalesce(new.reference, '') is distinct from coalesce(old.reference, '')
      or (new.montant_paye is distinct from old.montant_paye and new.statut is not distinct from old.statut)
    then
      raise exception 'dossiers:transition ne permet de modifier que le statut (et le paiement associé à la transition)';
    end if;
  end if;
  return new;
end;
$$;

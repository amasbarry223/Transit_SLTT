-- F-ANNEXE — annexe_id est NOT NULL sur ecritures/mouvements (20260810).
-- Deux RPC security definer insèrent directement dans ces tables sans passer
-- par le client (donc sans passer par les mappers mis à jour côté app) :
-- record_dossier_solde_paiement (ecritures) et validate_bon_sortie
-- (mouvements). Sans ce correctif, les deux échoueraient avec une violation
-- NOT NULL dès la première utilisation post-migration.

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
      date, date_paiement, client_id, dossier_id, societe_id, annexe_id,
      montant_investi, montant_paye, mode_paiement, note
    ) values (
      current_date,
      coalesce(p_date, current_date),
      d.client_id,
      d.id,
      d.societe_id,
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

  update public.dossiers
  set statut = 'Soldé', montant_paye = v_dossier_paye
  where id = p_dossier_id;

  return query
    select v_dossier_paye, e.id, e.montant_paye, e.mode_paiement, e.date_paiement, e.note;
end;
$$;

revoke all on function public.record_dossier_solde_paiement(uuid, numeric, text, date, text) from public;
grant execute on function public.record_dossier_solde_paiement(uuid, numeric, text, date, text) to authenticated;

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
    stock_id, societe_id, annexe_id, type, quantite, date, responsable, marchandise, unite, bon_ref
  ) values (
    s.id, s.societe_id, s.annexe_id, 'Sortie', b.quantite, now(), v_resp, s.marchandise, s.unite, b.reference
  );

  update public.bons_sortie set statut = 'Validé' where id = b.id returning * into b;
  return b;
end;
$$;

revoke all on function public.validate_bon_sortie(uuid, text) from public;
grant execute on function public.validate_bon_sortie(uuid, text) to authenticated;

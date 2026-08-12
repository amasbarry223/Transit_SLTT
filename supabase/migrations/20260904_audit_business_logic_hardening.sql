-- Audit logique métier (2026-08-12) : durcissement RPC dossier solde, RLS annexes,
-- excel_workbooks, FSM bons de sortie, séquence atomique RECU-{n}.

-- ---------------------------------------------------------------------------
-- 1. Séquence atomique pour références reçus de paiement
-- ---------------------------------------------------------------------------
create sequence if not exists public.recu_paiement_reference_seq;

select setval(
  'public.recu_paiement_reference_seq',
  greatest(
    1,
    coalesce(
      (
        select max(
          nullif(substring(reference from '^RECU-(\d+)$'), '')::bigint
        )
        from public.recus_paiement
      ),
      0
    ) + 1
  ),
  false
);

create or replace function public.next_recu_reference()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seq bigint;
begin
  if not public.has_permission('recus-paiement:write') then
    raise exception 'Permission recus-paiement:write requise';
  end if;
  v_seq := nextval('public.recu_paiement_reference_seq');
  return 'RECU-' || v_seq::text;
end;
$$;

revoke all on function public.next_recu_reference() from public;
grant execute on function public.next_recu_reference() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. RPC record_dossier_solde_paiement — exiger paiement intégral avant Soldé
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

-- ---------------------------------------------------------------------------
-- 3. Trigger : interdire statut Soldé sans paiement intégral (UPDATE direct)
-- ---------------------------------------------------------------------------
create or replace function public.assert_dossier_solde_integrity()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE'
     and new.statut is distinct from old.statut
     and new.statut = 'Soldé'
  then
    if current_setting('sltt.internal_dossier_solde', true) is distinct from '1' then
      if coalesce(new.montant_paye, 0) < coalesce(new.montant_investi, 0) then
        raise exception 'Impossible de passer le dossier à Soldé : paiement incomplet (reste dû %)',
          greatest(0, coalesce(new.montant_investi, 0) - coalesce(new.montant_paye, 0));
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_dossier_solde_integrity on public.dossiers;
create trigger trg_dossier_solde_integrity
  before update of statut, montant_paye on public.dossiers
  for each row execute function public.assert_dossier_solde_integrity();

-- ---------------------------------------------------------------------------
-- 4. RLS user_annexes — plafond annexe pour délégués utilisateurs:manage
-- ---------------------------------------------------------------------------
drop policy if exists user_annexes_mutate on public.user_annexes;

create policy user_annexes_mutate on public.user_annexes
  for all to authenticated
  using (
    public.is_admin()
    or (
      public.has_permission('utilisateurs:manage')
      and exists (
        select 1 from public.user_annexes ua
        where ua.user_id = auth.uid() and ua.annexe_id = user_annexes.annexe_id
      )
    )
  )
  with check (
    public.is_admin()
    or (
      public.has_permission('utilisateurs:manage')
      and exists (
        select 1 from public.user_annexes ua
        where ua.user_id = auth.uid() and ua.annexe_id = user_annexes.annexe_id
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 5. RLS excel_workbooks — cloisonnement par annexe du client
-- ---------------------------------------------------------------------------
drop policy if exists excel_workbooks_select on public.excel_workbooks;
drop policy if exists excel_workbooks_mutate on public.excel_workbooks;

create policy excel_workbooks_select on public.excel_workbooks
  for select to authenticated
  using (
    public.has_permission('comptabilite:read')
    and exists (
      select 1 from public.clients c
      where c.id = excel_workbooks.client_id
        and public.has_annexe_access(c.annexe_id)
    )
  );

create policy excel_workbooks_mutate on public.excel_workbooks
  for all to authenticated
  using (
    public.has_permission('comptabilite:write')
    and exists (
      select 1 from public.clients c
      where c.id = excel_workbooks.client_id
        and public.has_annexe_access(c.annexe_id)
    )
  )
  with check (
    public.has_permission('comptabilite:write')
    and exists (
      select 1 from public.clients c
      where c.id = excel_workbooks.client_id
        and public.has_annexe_access(c.annexe_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 6. FSM bons de sortie — validation uniquement via RPC
-- ---------------------------------------------------------------------------
create or replace function public.assert_bon_sortie_statut_transition()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.statut is distinct from old.statut then
    if new.statut = 'Validé' and old.statut is distinct from 'Validé' then
      if current_setting('sltt.internal_bon_validate', true) is distinct from '1' then
        raise exception 'Validation du bon de sortie uniquement via validate_bon_sortie()';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bon_sortie_statut_fsm on public.bons_sortie;
create trigger trg_bon_sortie_statut_fsm
  before update of statut on public.bons_sortie
  for each row execute function public.assert_bon_sortie_statut_transition();

-- Patch validate_bon_sortie pour autoriser la transition via session flag
drop function if exists public.validate_bon_sortie(uuid, text);

create or replace function public.validate_bon_sortie(p_bon_id uuid, p_responsable text default null)
returns table (
  bon public.bons_sortie,
  mouvement_id uuid
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
    and quantite >= b.quantite;
  if not found then
    raise exception 'Stock insuffisant (course concurrente)';
  end if;

  v_resp := coalesce(nullif(p_responsable, ''), 'Système');

  insert into public.mouvements (
    stock_id, societe_id, annexe_id, type, quantite, date, responsable, marchandise, unite, bon_ref
  ) values (
    s.id, s.societe_id, s.annexe_id, 'Sortie', b.quantite, now(), v_resp, s.marchandise, s.unite, b.reference
  )
  returning * into m;

  perform set_config('sltt.internal_bon_validate', '1', true);

  update public.bons_sortie set statut = 'Validé' where id = b.id returning * into b;

  return query select b, m.id;
end;
$$;

revoke all on function public.validate_bon_sortie(uuid, text) from public;
grant execute on function public.validate_bon_sortie(uuid, text) to authenticated;

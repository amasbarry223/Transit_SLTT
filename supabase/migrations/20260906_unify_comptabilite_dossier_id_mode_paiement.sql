-- Migration 20260906_unify_comptabilite_dossier_id_mode_paiement.sql
-- Unification du module Comptabilité : ajout des champs dossier_id et mode_paiement sur operations_comptables
-- pour permettre le rattachement optionnel d'une opération de caisse à un dossier de transit.

alter table public.operations_comptables
  add column if not exists dossier_id uuid references public.dossiers(id) on delete set null,
  add column if not exists mode_paiement text check (mode_paiement in ('Espèces', 'Virement', 'Mobile Money', 'Chèque')) default 'Espèces';

create index if not exists idx_operations_comptables_dossier_id
  on public.operations_comptables(dossier_id) where dossier_id is not null;

-- Trigger / Fonction PL/pgSQL pour mettre à jour automatiquement le montant_paye sur le dossier rattaché
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

  -- Calcul de la somme des Entrées moins Sorties rattachées à ce dossier dans operations_comptables
  select coalesce(sum(case when type = 'Entrée' then montant else -montant end), 0)
  into v_total_paye
  from public.operations_comptables
  where dossier_id = v_dossier_id;

  -- Récupération des infos du dossier
  select montant_investi, statut
  into v_montant_investi, v_statut_actuel
  from public.dossiers
  where id = v_dossier_id;

  -- Mise à jour du montant_paye sur le dossier
  update public.dossiers
  set montant_paye = greatest(0, v_total_paye),
      statut = case
        when greatest(0, v_total_paye) >= montant_investi and v_montant_investi > 0 and v_statut_actuel in ('En cours', 'Dédouané', 'Livré') then 'Soldé'
        else v_statut_actuel
      end,
      updated_at = now()
  where id = v_dossier_id;

  return null;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_sync_dossier_montant_paye on public.operations_comptables;
create trigger trg_sync_dossier_montant_paye
  after insert or update of dossier_id, montant, type or delete
  on public.operations_comptables
  for each row execute procedure public.sync_dossier_montant_paye_from_operations();

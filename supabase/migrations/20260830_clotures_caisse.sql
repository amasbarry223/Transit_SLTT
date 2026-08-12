-- Rapprochement de caisse périodique — remplace les lignes manuscrites
-- "ECART DE : ..." du classeur Excel par un enregistrement tracé par entité
-- comptable (Annexe Mali / Annexe CI / Société Top Doumani). Le fichier
-- source montre des rapprochements à intervalles irréguliers (pas
-- strictement mensuels — ex. "ÉCART de JUIN" constaté mi-juillet), d'où
-- periode_debut/periode_fin en bornes libres plutôt qu'un simple mois civil.
--
-- solde_theorique = somme (Entrée - Sortie) des operations_comptables de
-- l'entité sur la période, calculée côté application au moment de la
-- clôture et transmise telle quelle au RPC (pas recalculée en SQL ici, pour
-- rester cohérente avec le filtre/plage exact que l'utilisateur voit à
-- l'écran au moment de cliquer "Clôturer").

create table if not exists public.clotures_caisse (
    id uuid primary key default gen_random_uuid(),
    entite_type text not null check (entite_type in ('annexe', 'societe')),
    annexe_id uuid references public.annexes(id),
    societe_id uuid references public.societes(id),
    entite_key text generated always as (
      entite_type || ':' || coalesce(annexe_id::text, societe_id::text)
    ) stored,
    periode_debut date not null,
    periode_fin date not null,
    solde_theorique numeric not null default 0,
    solde_constate numeric not null default 0,
    ecart numeric generated always as (solde_theorique - solde_constate) stored,
    note text,
    cloture_par text,
    cloture_le timestamptz not null default now(),
    constraint clotures_caisse_entite_coherente check (
      (entite_type = 'annexe' and annexe_id is not null and societe_id is null)
      or
      (entite_type = 'societe' and societe_id is not null and annexe_id is null)
    ),
    constraint clotures_caisse_periode_coherente check (periode_fin >= periode_debut),
    unique (entite_key, periode_fin)
);

alter table public.clotures_caisse enable row level security;

drop policy if exists clotures_caisse_select on public.clotures_caisse;
drop policy if exists clotures_caisse_mutate on public.clotures_caisse;

create policy clotures_caisse_select on public.clotures_caisse for select to authenticated
  using (
    public.has_permission('comptabilite:read')
    and (entite_type = 'societe' or public.has_annexe_access(annexe_id))
  );
create policy clotures_caisse_mutate on public.clotures_caisse for all to authenticated
  using (
    public.has_permission('comptabilite:write')
    and (entite_type = 'societe' or public.has_annexe_access(annexe_id))
  )
  with check (
    public.has_permission('comptabilite:write')
    and (entite_type = 'societe' or public.has_annexe_access(annexe_id))
  );

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'clotures_caisse'
  ) then
    alter publication supabase_realtime add table public.clotures_caisse;
  end if;
end $$;

-- RPC atomique — sur le modèle de record_ecriture_paiement (has_permission +
-- vérification d'accès entité, upsert idempotent sur (entite_key, periode_fin)
-- pour permettre de recalculer/corriger une clôture sans créer de doublon).
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
as $$
declare
  v_cloture public.clotures_caisse%rowtype;
  v_user text;
begin
  if not public.has_permission('comptabilite:write') then
    raise exception 'Permission comptabilite:write requise';
  end if;
  if p_entite_type not in ('annexe', 'societe') then
    raise exception 'Type d''entité invalide: %', p_entite_type;
  end if;
  if p_entite_type = 'annexe' then
    if p_annexe_id is null or p_societe_id is not null then
      raise exception 'Clôture annexe : annexe_id requis, societe_id doit être vide';
    end if;
    if not public.has_annexe_access(p_annexe_id) then
      raise exception 'Annexe hors de votre périmètre';
    end if;
  else
    if p_societe_id is null or p_annexe_id is not null then
      raise exception 'Clôture société : societe_id requis, annexe_id doit être vide';
    end if;
  end if;
  if p_periode_debut is null or p_periode_fin is null or p_periode_fin < p_periode_debut then
    raise exception 'Période de clôture invalide';
  end if;

  select coalesce(p.nom, 'Système') into v_user
  from public.profiles p where p.id = auth.uid();

  insert into public.clotures_caisse (
    entite_type, annexe_id, societe_id, periode_debut, periode_fin,
    solde_theorique, solde_constate, note, cloture_par, cloture_le
  ) values (
    p_entite_type, p_annexe_id, p_societe_id, p_periode_debut, p_periode_fin,
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
$$;

revoke all on function public.record_cloture_caisse(text, date, date, numeric, numeric, uuid, uuid, text) from public;
grant execute on function public.record_cloture_caisse(text, date, date, numeric, numeric, uuid, uuid, text) to authenticated;

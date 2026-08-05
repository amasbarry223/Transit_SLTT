-- Sauvegarde / restauration / purge complète des données métier, réservées aux
-- Administrateurs (Paramètres > Sauvegarde). Découverte dynamique des tables
-- (information_schema) plutôt qu'une liste figée : reste correcte même si le
-- schéma dérive des migrations suivies ici. profiles/societes/annexes/
-- user_annexes sont exclues — c'est l'identité et la structure de l'app, pas
-- des données métier ; les effacer verrouillerait l'admin lui-même hors de
-- l'application et supprimerait la config société/annexe.
--
-- Gate de permission : 'systeme:backup' n'est volontairement PAS répertorié
-- dans PERMISSION_MODULES (src/lib/permissions.ts) — impossible à distribuer
-- à un non-Administrateur depuis l'éditeur de permissions. has_permission()
-- retourne déjà true pour role = 'Administrateur' quel que soit le nom du
-- droit demandé ; ce nom n'est donc satisfiable que par un Administrateur.

-- Nouveau module d'audit pour tracer sauvegarde/purge/restauration.
alter table public.audit_logs drop constraint if exists audit_logs_module_check;

alter table public.audit_logs add constraint audit_logs_module_check check (
  module = any (
    array[
      'Authentification'::text,
      'Dossiers'::text,
      'Comptabilité'::text,
      'Factures'::text,
      'Stock'::text,
      'Bons'::text,
      'Clients'::text,
      'Transporteurs'::text,
      'Utilisateurs'::text,
      'Fournisseurs'::text,
      'Devis'::text,
      'Contrats'::text,
      'Dépenses'::text,
      'Sociétés'::text,
      'Annexes'::text,
      'Archives'::text,
      'Documents'::text,
      'Système'::text
    ]
  )
);

create or replace function public.list_business_tables()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(table_name order by table_name), array[]::text[])
  from information_schema.tables
  where table_schema = 'public'
    and table_type = 'BASE TABLE'
    and table_name not in ('profiles', 'societes', 'annexes', 'user_annexes');
$$;

revoke all on function public.list_business_tables() from public;
grant execute on function public.list_business_tables() to authenticated;

-- ---------------------------------------------------------------------------
-- Export : { meta: { exportedAt, tables }, data: { <table>: [...lignes] } }
-- ---------------------------------------------------------------------------
create or replace function public.export_business_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  tbl text;
  rows_json jsonb;
  data jsonb := '{}'::jsonb;
begin
  if not public.has_permission('systeme:backup') then
    raise exception 'Permission systeme:backup requise (réservé aux administrateurs)';
  end if;

  foreach tbl in array public.list_business_tables()
  loop
    execute format(
      'select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.%I t',
      tbl
    ) into rows_json;
    data := data || jsonb_build_object(tbl, rows_json);
  end loop;

  return jsonb_build_object(
    'meta', jsonb_build_object('exportedAt', now(), 'tables', public.list_business_tables()),
    'data', data
  );
end;
$$;

revoke all on function public.export_business_data() from public;
grant execute on function public.export_business_data() to authenticated;

-- ---------------------------------------------------------------------------
-- Purge : TRUNCATE ... CASCADE (une seule instruction, ordre de dépendance
-- résolu par Postgres) après avoir compté chaque table pour le rapport
-- affiché à l'admin. Retourne { <table>: nb_lignes_supprimées }.
-- ---------------------------------------------------------------------------
create or replace function public.wipe_business_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  tbl text;
  tables text[] := public.list_business_tables();
  cnt bigint;
  report jsonb := '{}'::jsonb;
  truncate_list text := '';
begin
  if not public.has_permission('systeme:backup') then
    raise exception 'Permission systeme:backup requise (réservé aux administrateurs)';
  end if;

  foreach tbl in array tables
  loop
    execute format('select count(*) from public.%I', tbl) into cnt;
    report := report || jsonb_build_object(tbl, cnt);
    truncate_list := truncate_list || format('public.%I, ', tbl);
  end loop;

  if truncate_list <> '' then
    execute 'truncate table ' || left(truncate_list, length(truncate_list) - 2) || ' restart identity cascade';
  end if;

  return report;
end;
$$;

revoke all on function public.wipe_business_data() from public;
grant execute on function public.wipe_business_data() to authenticated;

-- ---------------------------------------------------------------------------
-- Restauration : purge puis réinsertion depuis un payload { <table>: [...] }
-- (format produit par export_business_data → 'data'). session_replication_role
-- = replica désactive contraintes FK et triggers le temps du chargement, comme
-- pg_restore --disable-triggers — évite d'avoir à trier ~25 tables par
-- dépendance. Seules les tables de list_business_tables() sont acceptées :
-- une clé de payload en dehors de cette liste (ex. "profiles" falsifié) est
-- ignorée plutôt qu'exécutée.
-- ---------------------------------------------------------------------------
create or replace function public.restore_business_data(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  tbl text;
  allowed text[] := public.list_business_tables();
  cnt bigint;
  report jsonb := '{}'::jsonb;
begin
  if not public.has_permission('systeme:backup') then
    raise exception 'Permission systeme:backup requise (réservé aux administrateurs)';
  end if;
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'Format de sauvegarde invalide : objet JSON attendu.';
  end if;

  perform public.wipe_business_data();

  set local session_replication_role = replica;

  foreach tbl in array allowed
  loop
    if payload ? tbl and jsonb_typeof(payload -> tbl) = 'array' then
      execute format(
        'insert into public.%I select * from jsonb_populate_recordset(null::public.%I, $1)',
        tbl, tbl
      ) using (payload -> tbl);
      get diagnostics cnt = row_count;
      report := report || jsonb_build_object(tbl, cnt);
    end if;
  end loop;

  set local session_replication_role = origin;

  return report;
end;
$$;

revoke all on function public.restore_business_data(jsonb) from public;
grant execute on function public.restore_business_data(jsonb) to authenticated;

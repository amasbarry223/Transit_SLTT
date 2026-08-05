-- Corrige deux bugs de 20260821_admin_backup_restore.sql :
--
-- 1. audit_logs n'était pas exclue de list_business_tables(), donc
--    wipe_business_data() la TRUNCATE (perte de tout l'historique d'audit,
--    y compris la trace des purges/restaurations précédentes) et
--    restore_business_data() l'écrase avec l'instantané du backup restauré.
--    Le journal d'audit doit survivre indépendamment des données métier —
--    on l'exclut au même titre que profiles/societes/annexes/user_annexes.
--
-- 2. restore_business_data() ignorait silencieusement toute table absente
--    du payload (backup plus ancien qu'une table métier, ou payload édité à
--    la main) : après la purge, cette table restait vide sans qu'aucun
--    signal ne remonte à l'admin. On renvoie désormais explicitement la
--    liste des tables manquantes.

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
    and table_name not in ('profiles', 'societes', 'annexes', 'user_annexes', 'audit_logs');
$$;

-- ---------------------------------------------------------------------------
-- Restauration : même logique que 20260821, mais renvoie désormais
-- { restored: { <table>: nb_lignes }, missingTables: [<table>...] } au lieu
-- d'ignorer silencieusement les tables absentes du payload.
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
  missing text[] := array[]::text[];
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
    else
      missing := array_append(missing, tbl);
    end if;
  end loop;

  set local session_replication_role = origin;

  return jsonb_build_object('restored', report, 'missingTables', to_jsonb(missing));
end;
$$;

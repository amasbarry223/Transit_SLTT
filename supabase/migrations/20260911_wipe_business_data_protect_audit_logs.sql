-- Corrige un bug non résolu par 20260822_fix_backup_audit_logs_and_restore_report.sql :
-- exclure audit_logs de list_business_tables() ne suffit pas à le protéger
-- de wipe_business_data(). audit_logs.client_id référence clients.id avec
-- ON DELETE SET NULL (20260726_audit_logs_client_id.sql) — mais
-- TRUNCATE ... CASCADE ignore entièrement l'action ON DELETE : il vide
-- purement et simplement toute table qui référence une table tronquée. Donc
-- chaque purge/restauration (restore_business_data() appelle
-- wipe_business_data() en interne) effaçait encore tout le journal d'audit,
-- y compris la trace des purges précédentes — exactement ce que 20260822
-- prétendait avoir corrigé.
--
-- Correctif : détacher temporairement le lien client_id -> clients avant le
-- TRUNCATE (le nom de la contrainte est retrouvé dynamiquement plutôt que
-- supposé, pour rester correct même si elle a été renommée), puis le
-- rétablir à l'identique juste après.
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
  v_fk_name text;
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
    select tc.constraint_name into v_fk_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
    where tc.table_schema = 'public'
      and tc.table_name = 'audit_logs'
      and tc.constraint_type = 'FOREIGN KEY'
      and kcu.column_name = 'client_id'
    limit 1;

    if v_fk_name is not null then
      execute format('alter table public.audit_logs drop constraint %I', v_fk_name);
    end if;
    update public.audit_logs set client_id = null where client_id is not null;

    execute 'truncate table ' || left(truncate_list, length(truncate_list) - 2) || ' restart identity cascade';

    alter table public.audit_logs
      add constraint audit_logs_client_id_fkey
      foreign key (client_id) references public.clients(id) on delete set null;
  end if;

  return report;
end;
$$;

revoke all on function public.wipe_business_data() from public;
grant execute on function public.wipe_business_data() to authenticated;

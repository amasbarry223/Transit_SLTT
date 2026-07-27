-- Classeurs Excel embarqués (Univer) — un classeur par client, snapshot JSON + xlsx Storage.
create table if not exists public.excel_workbooks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  societe_id uuid null references public.societes(id) on delete set null,
  nom text not null,
  storage_path text null,
  snapshot_json jsonb null,
  version integer not null default 1,
  updated_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id)
);

create index if not exists idx_excel_workbooks_client_id on public.excel_workbooks(client_id);
create index if not exists idx_excel_workbooks_societe_id on public.excel_workbooks(societe_id);

drop trigger if exists excel_workbooks_updated_at on public.excel_workbooks;
create trigger excel_workbooks_updated_at
  before update on public.excel_workbooks
  for each row execute procedure public.update_updated_at_column();

alter table public.excel_workbooks enable row level security;

create policy excel_workbooks_select on public.excel_workbooks
  for select to authenticated
  using (public.has_permission('comptabilite:read'));

create policy excel_workbooks_mutate on public.excel_workbooks
  for all to authenticated
  using (public.has_permission('comptabilite:write'))
  with check (public.has_permission('comptabilite:write'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'excel-workbooks',
  'excel-workbooks',
  false,
  52428800,
  array[
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/octet-stream'
  ]
)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'excel_workbooks_storage_select' and tablename = 'objects'
  ) then
    create policy excel_workbooks_storage_select on storage.objects
      for select to authenticated
      using (bucket_id = 'excel-workbooks' and public.has_permission('comptabilite:read'));
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'excel_workbooks_storage_insert' and tablename = 'objects'
  ) then
    create policy excel_workbooks_storage_insert on storage.objects
      for insert to authenticated
      with check (bucket_id = 'excel-workbooks' and public.has_permission('comptabilite:write'));
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'excel_workbooks_storage_update' and tablename = 'objects'
  ) then
    create policy excel_workbooks_storage_update on storage.objects
      for update to authenticated
      using (bucket_id = 'excel-workbooks' and public.has_permission('comptabilite:write'))
      with check (bucket_id = 'excel-workbooks' and public.has_permission('comptabilite:write'));
  end if;
  if not exists (
    select 1 from pg_policies where policyname = 'excel_workbooks_storage_delete' and tablename = 'objects'
  ) then
    create policy excel_workbooks_storage_delete on storage.objects
      for delete to authenticated
      using (bucket_id = 'excel-workbooks' and public.has_permission('comptabilite:write'));
  end if;
end $$;

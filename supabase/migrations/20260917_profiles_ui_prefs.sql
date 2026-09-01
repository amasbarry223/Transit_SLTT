-- Préférences UI (thème, format de date, annexe active) sur profiles.
-- Self-update déjà autorisé pour nom/email ; protect_profiles_sensitive_columns
-- n'interdit que role/permissions/actif, donc ces colonnes sont self-writable.
-- La garde selected_annexe_id empêche de pointer une annexe hors user_annexes.

alter table public.profiles
  add column if not exists theme text not null default 'light',
  add column if not exists date_format text not null default 'dmy',
  add column if not exists selected_annexe_id uuid null references public.annexes(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_theme_check' and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_theme_check check (theme in ('light', 'dark'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_date_format_check' and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_date_format_check check (date_format in ('dmy', 'mdy', 'ymd'));
  end if;
end
$$;

create index if not exists idx_profiles_selected_annexe_id
  on public.profiles (selected_annexe_id)
  where selected_annexe_id is not null;

create or replace function public.protect_profiles_selected_annexe()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.selected_annexe_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.user_annexes ua
    where ua.user_id = new.id
      and ua.annexe_id = new.selected_annexe_id
  ) then
    raise exception 'Annexe hors périmètre de l''utilisateur'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_profiles_selected_annexe on public.profiles;
create trigger trg_protect_profiles_selected_annexe
  before insert or update of selected_annexe_id on public.profiles
  for each row
  execute function public.protect_profiles_selected_annexe();

create or replace function public.clear_selected_annexe_on_unassign()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set selected_annexe_id = null
  where id = old.user_id
    and selected_annexe_id = old.annexe_id;
  return old;
end;
$$;

drop trigger if exists trg_clear_selected_annexe_on_unassign on public.user_annexes;
create trigger trg_clear_selected_annexe_on_unassign
  after delete on public.user_annexes
  for each row
  execute function public.clear_selected_annexe_on_unassign();

revoke all on function public.protect_profiles_selected_annexe() from public, anon, authenticated;
revoke all on function public.clear_selected_annexe_on_unassign() from public, anon, authenticated;

-- F-ANNEXE — Rattachement utilisateur ↔ annexe (many-to-many) et fonctions
-- RLS associées. C'est ce qui manque à `societes` pour être un vrai
-- périmètre de sécurité : sans cette table, annexe_id ne serait qu'un
-- second filtre UI de plus.

create table if not exists public.user_annexes (
    user_id uuid not null references public.profiles(id) on delete cascade,
    annexe_id uuid not null references public.annexes(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, annexe_id)
);

create index if not exists idx_user_annexes_annexe_id on public.user_annexes(annexe_id);

-- Backfill : tous les profils existants → Mali uniquement (aucun accès CI
-- tant qu'un admin ne l'assigne pas explicitement depuis Paramètres).
insert into public.user_annexes (user_id, annexe_id)
select p.id, '33333333-3333-3333-3333-333333333333'
from public.profiles p
on conflict (user_id, annexe_id) do nothing;

alter table public.user_annexes enable row level security;

create policy user_annexes_select on public.user_annexes for select to authenticated
  using (
    user_id = auth.uid()
    or public.has_permission('parametres:read')
    or public.has_permission('utilisateurs:manage')
    or public.is_admin()
  );

create policy user_annexes_mutate on public.user_annexes for all to authenticated
  using (public.has_permission('utilisateurs:manage') or public.is_admin())
  with check (public.has_permission('utilisateurs:manage') or public.is_admin());

-- has_annexe_access(annexe) : brique RLS réutilisée par toutes les policies
-- des tables cloisonnées (cf. 20260812_rls_annexe_scoping.sql), même forme
-- que has_permission().
create or replace function public.has_annexe_access(target_annexe uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_annexes ua
    where ua.user_id = auth.uid() and ua.annexe_id = target_annexe
  );
$$;

-- user_annexe_ids() : liste des annexes accessibles à l'appelant, utilisée
-- côté app (hydratation du store, sélecteur d'annexe).
create or replace function public.user_annexe_ids()
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(ua.annexe_id), array[]::uuid[])
  from public.user_annexes ua
  where ua.user_id = auth.uid();
$$;

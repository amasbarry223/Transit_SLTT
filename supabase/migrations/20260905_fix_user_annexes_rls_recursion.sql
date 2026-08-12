-- Fix infinite recursion in user_annexes_mutate policy.
-- The 20260904 policy queried user_annexes inside its own RLS check;
-- use has_annexe_access() (security definer) instead, same as every other table.

drop policy if exists user_annexes_mutate on public.user_annexes;

create policy user_annexes_mutate on public.user_annexes
  for all to authenticated
  using (
    public.is_admin()
    or (
      public.has_permission('utilisateurs:manage')
      and public.has_annexe_access(annexe_id)
    )
  )
  with check (
    public.is_admin()
    or (
      public.has_permission('utilisateurs:manage')
      and public.has_annexe_access(annexe_id)
    )
  );

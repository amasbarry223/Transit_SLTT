-- Corrige le seed permissions documents:* pour le rôle réel « Agent de transit »
-- (la migration 20260802 ciblait à tort le rôle legacy « Agent »).

update public.profiles
set permissions = (
  select array(
    select distinct unnest(
      coalesce(permissions, '{}'::text[])
      || array['documents:read', 'documents:write']::text[]
    )
  )
)
where role = 'Agent de transit'
  and (
    permissions is null
    or not (permissions @> array['documents:read']::text[])
    or not (permissions @> array['documents:write']::text[])
  );

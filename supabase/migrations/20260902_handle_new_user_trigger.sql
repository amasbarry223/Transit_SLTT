-- Documente et rend reproductible un trigger qui existait déjà sur le
-- projet Supabase (créé hors migrations, probablement via le Dashboard) et
-- qui n'était tracké nulle part dans le repo : à la création d'un compte
-- auth.users, il provisionne automatiquement la ligne public.profiles
-- correspondante à partir de raw_user_meta_data (nom/role/permissions).
--
-- C'est ce qui permet à POST /api/admin/users de faire un simple UPDATE
-- (pas un INSERT) juste après admin.auth.admin.createUser() — comportement
-- vérifié en direct sur le projet (création d'un compte de test, la ligne
-- profiles apparaît immédiatement avec actif=true et les métadonnées
-- copiées). Sans ce trigger tracké ici, reconstruire ce projet depuis les
-- migrations seules (reset, nouvel environnement, disaster recovery)
-- casserait silencieusement toute création de compte : POST
-- /api/admin/users ferait un UPDATE sur une ligne profiles inexistante, ne
-- trouverait aucune ligne, et annulerait la création du compte auth
-- (rollback), sans qu'aucun message n'indique pourquoi.
--
-- `on conflict (id) do nothing` : si la ligne existe déjà (ex. compte
-- provisionné manuellement avant que ce trigger n'existe), on ne l'écrase
-- pas silencieusement.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nom, email, role, permissions, actif)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'nom'), ''), new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'Agent de transit'),
    coalesce(
      (select array_agg(x) from jsonb_array_elements_text(new.raw_user_meta_data->'permissions') as x),
      '{}'
    ),
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

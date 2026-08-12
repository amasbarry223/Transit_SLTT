-- Audit : convertDevisToDossier() (src/lib/store/devis-slice.ts) ne gardait
-- la non-duplication ("déjà converti") que côté état client. Deux appels
-- concurrents (double-clic, deux onglets) lisent tous deux dossier_id = null,
-- créent chacun un dossier distinct, puis les deux UPDATE devis SET
-- dossier_id=... s'exécutaient sans condition — le dernier écrasait
-- silencieusement le premier, laissant un dossier orphelin, numéroté et
-- facturable, sans lien avec son devis d'origine.
--
-- Cette RPC rend l'étape de liaison atomique et conditionnelle : seul le
-- premier appelant peut lier son dossier au devis, le second reçoit une
-- exception explicite. Le code appelant (devis-slice.ts) déclenche déjà un
-- rollback compensatoire (suppression du dossier orphelin) sur toute erreur
-- de cette étape — il suffit donc que l'update échoue proprement au lieu de
-- réussir silencieusement.

create or replace function public.link_devis_to_dossier(p_devis_id uuid, p_dossier_id uuid)
returns public.devis
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.devis%rowtype;
begin
  if not public.has_permission('devis:write') then
    raise exception 'Permission devis:write requise';
  end if;

  update public.devis
  set statut = 'Accepté', dossier_id = p_dossier_id
  where id = p_devis_id and dossier_id is null
  returning * into v;

  if not found then
    raise exception 'Devis déjà converti ou introuvable (conversion concurrente détectée)';
  end if;

  if not public.has_annexe_access(v.annexe_id) then
    raise exception 'Devis hors de votre périmètre d''annexe';
  end if;

  return v;
end;
$$;

revoke all on function public.link_devis_to_dossier(uuid, uuid) from public;
grant execute on function public.link_devis_to_dossier(uuid, uuid) to authenticated;

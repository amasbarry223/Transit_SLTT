-- Archives — suppression réservée aux administrateurs.
-- La policy archives_mutate ("for all") couvrait insert/update/delete sous
-- archives:write ; on la sépare : insert reste sur archives:write, delete
-- passe sur is_admin(). Pas de policy update : rien dans l'app ne modifie
-- une ligne archives après création (seulement insert/delete).

drop policy if exists archives_mutate on public.archives;

create policy archives_insert on public.archives for insert to authenticated
  with check (public.has_permission('archives:write'));
create policy archives_delete on public.archives for delete to authenticated
  using (public.is_admin());

-- Storage : même règle sur le bucket privé archives.
DROP POLICY IF EXISTS archives_storage_delete ON storage.objects;

CREATE POLICY archives_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'archives' AND public.is_admin());

-- ⚠️ Limite assumée : l'écran Archives affiche aussi en lecture des fichiers
-- venant de dossier_fichiers/contrat_fichiers, dont la suppression reste régie
-- par leurs propres policies (dossiers:write / contrats:write, non admin-only) —
-- volontairement inchangées pour ne pas casser la suppression déjà existante
-- depuis les écrans Dossier/Contrat (RLS ne peut pas distinguer l'écran
-- d'origine de la requête). Pour ces deux sources, l'admin-only d'Archives
-- n'est qu'une garde côté interface, pas un verrou serveur. Décision confirmée
-- avec l'utilisateur — ne pas "corriger" sans revoir cet écran.

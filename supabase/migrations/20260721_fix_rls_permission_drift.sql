-- Corrige un décalage entre le catalogue de permissions applicatif
-- (src/lib/permissions.ts) et les policies RLS réelles, introduit lors de
-- deux scissions de permission qui n'avaient mis à jour que le code
-- applicatif :
--
-- 1. "parametres:read" a été scindé en "parametres:read" + "audit:read",
--    mais audit_logs_select vérifiait toujours l'ancienne clé — un
--    utilisateur avec parametres:read (mais pas audit:read) pouvait donc
--    encore lire tout le journal d'audit en interrogeant la table
--    directement (hors UI, qui elle vérifie déjà audit:read).
--
-- 2. "bons:write" a été scindé en "bons:write" (marchandise) et
--    "bons:write-caisse" (décaissements), mais les policies de
--    bons_sortie_caisse vérifiaient toujours "bons:write" — un Magasinier
--    (qui a bons:write pour le stock, mais plus bons:write-caisse depuis
--    la refonte) conservait donc un accès en écriture aux décaissements de
--    caisse au niveau base, malgré la restriction voulue côté application.

drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (public.has_permission('audit:read') or public.is_admin());

drop policy if exists bons_sortie_caisse_mutate on public.bons_sortie_caisse;
create policy bons_sortie_caisse_mutate on public.bons_sortie_caisse
  for all to authenticated
  using (public.has_permission('bons:write-caisse'))
  with check (public.has_permission('bons:write-caisse'));

drop policy if exists bons_sortie_caisse_lignes_mutate on public.bons_sortie_caisse_lignes;
create policy bons_sortie_caisse_lignes_mutate on public.bons_sortie_caisse_lignes
  for all to authenticated
  using (public.has_permission('bons:write-caisse'))
  with check (public.has_permission('bons:write-caisse'));

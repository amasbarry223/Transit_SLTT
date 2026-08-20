import { RouteSync } from "@/components/sltt/route-sync";
import type { ComptaTab, ViewKey } from "@/lib/nav-store";

/**
 * Page liste / vue SPA branchée sur une URL deep-link.
 * Ne rend que la synchronisation URL → nav-store : `AppRoot` (auth,
 * chargement des données, shell applicatif) vit une seule fois dans le
 * layout racine — le remonter ici sur chaque route reviendrait à revérifier
 * la session et recharger tout le dataset à chaque changement d'onglet.
 */
export function ViewRoutePage({
  view,
  id,
  dossierMode,
  comptaTab,
}: {
  view: ViewKey;
  id?: string;
  dossierMode?: "create" | "edit";
  comptaTab?: ComptaTab;
}) {
  return <RouteSync view={view} id={id} dossierMode={dossierMode} comptaTab={comptaTab} />;
}

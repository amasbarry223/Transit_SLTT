import { AppRoot } from "@/components/sltt/app-root";
import { RouteSync } from "@/components/sltt/route-sync";
import type { ViewKey } from "@/lib/nav-store";

/** Page liste / vue SPA branchée sur une URL deep-link. */
export function ViewRoutePage({
  view,
  id,
  dossierMode,
}: {
  view: ViewKey;
  id?: string;
  dossierMode?: "create" | "edit";
}) {
  return (
    <>
      <RouteSync view={view} id={id} dossierMode={dossierMode} />
      <AppRoot />
    </>
  );
}

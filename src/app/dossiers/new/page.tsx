import { AppRoot } from "@/components/sltt/app-root";
import { RouteSync } from "@/components/sltt/route-sync";

export default function NewDossierPage() {
  return (
    <>
      <RouteSync view="dossier-form" id="new" dossierMode="create" />
      <AppRoot />
    </>
  );
}

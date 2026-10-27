"use client";

import { ArrowLeft, Info } from "lucide-react";
import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { Button } from "@/shared/components/ui/button";
import { DossierScreenRedesign } from "./dossier-screen-redesign";

export function DossierFormScreen() {
  const { selectedId, dossierFormMode } = useNav();
  return (
    <DossierFormInner key={`${dossierFormMode}-${selectedId ?? "new"}`} />
  );
}

function DossierFormInner() {
  const { selectedId, dossierFormMode, go } = useNav();
  const dossiers = useStore((s) => s.dossiers);

  const isEdit = dossierFormMode === "edit";
  const existing =
    isEdit && selectedId ? dossiers.find((d) => d.id === selectedId) : undefined;

  if (isEdit && selectedId && !existing) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
          <Info className="size-7" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Dossier introuvable
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Le dossier demandé n&apos;existe pas ou a été supprimé.
          </p>
        </div>
        <Button variant="outline" onClick={() => go("dossiers")}>
          <ArrowLeft className="size-4" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <DossierScreenRedesign
      existingDossier={existing}
      isEdit={isEdit}
    />
  );
}

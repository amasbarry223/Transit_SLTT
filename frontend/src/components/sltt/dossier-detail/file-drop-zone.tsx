"use client";

import type { DossierFichier, FichierInput } from "@/lib/store";
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from "@/lib/constants";
import { EntityFileDropZone } from "@/components/sltt/entity-file-drop-zone";

export function FileDropZone({
  dossierId,
  sousDossierId,
  fichiers,
  onUpload,
  onDelete,
  canWrite = true,
}: {
  dossierId: string;
  sousDossierId?: string;
  fichiers: DossierFichier[];
  onUpload: (input: FichierInput) => void;
  onDelete: (id: string) => Promise<void>;
  canWrite?: boolean;
}) {
  return (
    <EntityFileDropZone
      files={fichiers}
      canWrite={canWrite}
      maxBytes={MAX_FILE_SIZE_BYTES}
      maxMbLabel={MAX_FILE_SIZE_MB}
      labels={{
        dropTitle: "Glissez vos PDF ici",
        dropSubtitle: `ou cliquez pour sélectionner · Max ${MAX_FILE_SIZE_MB} Mo par fichier`,
        empty: "Aucun fichier pour l'instant",
        added: "Fichier ajouté",
        deleted: "Fichier supprimé",
        deleteDialogTitle: "Supprimer ce fichier ?",
        deleteDialogDescription: (nom) => (
          <>Le fichier « {nom} » sera définitivement supprimé.</>
        ),
        ariaDrop: "Cliquer ou déposer des fichiers ici",
      }}
      onUpload={(payload) => {
        onUpload({
          dossierId,
          sousDossierId,
          nom: payload.nom,
          taille: payload.taille,
          type: payload.type,
          dataUrl: payload.dataUrl,
        });
      }}
      onDelete={onDelete}
      onOpen={(f) => {
        const a = document.createElement("a");
        a.href = f.dataUrl;
        a.download = f.nom;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }}
    />
  );
}

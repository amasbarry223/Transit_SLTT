"use client";

import { useToast } from "@/hooks/use-toast";
import { toastWarning } from "@/lib/toast-helpers";
import { EntityFileDropZone } from "@/components/sltt/entity-file-drop-zone";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo (aligné sur la limite du bucket contrat-fichiers)

export function ContratFileDropZone({
  contratId,
  fichiers,
  canWrite,
  onUpload,
  onDelete,
  getSignedUrl,
}: {
  contratId: string;
  fichiers: Array<{
    id: string;
    nom: string;
    taille: number;
    type: string;
    dateUpload: string;
    storagePath: string;
  }>;
  canWrite: boolean;
  onUpload: (input: {
    contratId: string;
    nom: string;
    taille: number;
    type: string;
    dataUrl: string;
  }) => Promise<unknown>;
  onDelete: (id: string) => Promise<void>;
  getSignedUrl: (storagePath: string) => Promise<string>;
}) {
  const { toast } = useToast();

  return (
    <EntityFileDropZone
      files={fichiers}
      canWrite={canWrite}
      maxBytes={MAX_FILE_SIZE}
      maxMbLabel={10}
      labels={{
        dropTitle: "Déposer des scans ici",
        dropSubtitle: "ou cliquer pour sélectionner · Stockage privé · Max 10 Mo",
        empty: "Aucun document archivé",
        added: "Document ajouté",
        deleted: "Document supprimé",
        deleteDialogTitle: "Supprimer ce document ?",
        deleteDialogDescription: (nom) => (
          <>Le document « {nom} » sera définitivement supprimé. Cette action est irréversible.</>
        ),
        ariaDrop: "Cliquer ou déposer des fichiers ici pour les joindre au contrat",
      }}
      onUpload={async (payload) => {
        await onUpload({
          contratId,
          nom: payload.nom,
          taille: payload.taille,
          type: payload.type,
          dataUrl: payload.dataUrl,
        });
      }}
      onDelete={onDelete}
      onOpen={async (f) => {
        try {
          const url = await getSignedUrl(f.storagePath);
          window.open(url, "_blank", "noopener");
        } catch {
          toastWarning(toast, { title: "Impossible d'ouvrir le document" });
        }
      }}
    />
  );
}

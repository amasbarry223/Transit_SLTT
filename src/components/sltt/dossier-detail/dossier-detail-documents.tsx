"use client";

import { FileText, FolderOpen, FolderPlus } from "lucide-react";
import type { DossierFichier, FichierInput, SubDossier } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/sltt/empty-state";
import { GlossaryLabel } from "@/components/sltt/glossary-label";
import { FileDropZone } from "./file-drop-zone";
import { SubDossierCard } from "./sub-dossier-card";

export function DossierDetailDocuments({
  dossierId,
  dossierFichiers,
  subDossiers,
  fichiersBySubDossier,
  onCreateSubDossier,
  onEditSubDossier,
  onDeleteSubDossier,
  addFichier,
  deleteFichier,
  canWrite = true,
}: {
  dossierId: string;
  dossierFichiers: DossierFichier[];
  subDossiers: SubDossier[];
  fichiersBySubDossier: Map<string, DossierFichier[]>;
  onCreateSubDossier: () => void;
  onEditSubDossier: (sd: SubDossier) => void;
  onDeleteSubDossier: (id: string) => void;
  addFichier: (input: FichierInput) => void;
  deleteFichier: (id: string) => Promise<void>;
  canWrite?: boolean;
}) {
  return (
    <div className="space-y-8">
      <Card className="border-border/80 p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Fichiers joints</h2>
            <p className="text-xs text-slate-500">Scannez ou déposez les documents liés à ce dossier (PDF, images…)</p>
          </div>
        </div>
        <FileDropZone
          dossierId={dossierId}
          fichiers={dossierFichiers}
          onUpload={addFichier}
          onDelete={deleteFichier}
          canWrite={canWrite}
        />
      </Card>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">
              <GlossaryLabel term="sousDossier" showIcon={false} /> ({subDossiers.length})
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">Classez vos pièces par thème : douane, livraison, BL…</p>
          </div>
          {canWrite && (
          <Button onClick={onCreateSubDossier}>
            <FolderPlus className="size-4" />
            Nouveau sous-dossier
          </Button>
          )}
        </div>

        {subDossiers.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Aucun sous-dossier"
            description="Créez des sous-dossiers pour organiser vos documents par étape ou par type."
            action={
              canWrite ? (
                <Button onClick={onCreateSubDossier}>
                  <FolderPlus className="size-4" />
                  Créer un sous-dossier
                </Button>
              ) : undefined
            }
          />
        ) : (
          subDossiers.map((sd) => (
            <SubDossierCard
              key={sd.id}
              sd={sd}
              fichiers={fichiersBySubDossier.get(sd.id) ?? []}
              onEdit={() => onEditSubDossier(sd)}
              onDelete={() => onDeleteSubDossier(sd.id)}
              addFichier={addFichier}
              deleteFichier={deleteFichier}
              canWrite={canWrite}
            />
          ))
        )}
      </div>
    </div>
  );
}

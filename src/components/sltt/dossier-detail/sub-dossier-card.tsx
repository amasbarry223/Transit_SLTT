"use client";

import { useState } from "react";
import {
  Folder,
  FolderOpen,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { DossierFichier, FichierInput, SubDossier } from "@/lib/store";
import { formatDateShort } from "@/lib/format";
import { GlossaryLabel } from "@/components/sltt/glossary-label";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "./file-drop-zone";

export function SubDossierCard({
  sd,
  fichiers,
  onEdit,
  onDelete,
  addFichier,
  deleteFichier,
  canWrite = true,
}: {
  sd: SubDossier;
  fichiers: DossierFichier[];
  onEdit: () => void;
  onDelete: () => void;
  addFichier: (input: FichierInput) => void;
  deleteFichier: (id: string) => Promise<void>;
  canWrite?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm dark:bg-slate-900">
      <div
        className="flex cursor-pointer items-center gap-3 px-4 py-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/60"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary dark:bg-blue-950/40">
          {expanded ? <FolderOpen className="size-4" /> : <Folder className="size-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{sd.nom}</p>
          <p className="text-xs text-slate-500">
            <GlossaryLabel term="sousDossier" showIcon={false} className="text-xs" /> ·{" "}
            {fichiers.length} fichier{fichiers.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canWrite && (
        <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="size-7" onClick={onEdit}>
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={onDelete}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
        )}
        {expanded ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
      </div>
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {sd.description && <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">{sd.description}</p>}
          <FileDropZone
            dossierId={sd.dossierId}
            sousDossierId={sd.id}
            fichiers={fichiers}
            onUpload={addFichier}
            onDelete={deleteFichier}
            canWrite={canWrite}
          />
        </div>
      )}
    </div>
  );
}

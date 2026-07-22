"use client";

import { useRef, useState } from "react";
import { Upload, Download, Trash2 } from "lucide-react";
import type { DossierFichier, FichierInput } from "@/lib/store";
import { formatDateShort } from "@/lib/format";
import { formatFileSize, getFileIconComponent } from "@/lib/file-utils";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from "@/lib/constants";

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
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fichierToDelete, setFichierToDelete] = useState<{ id: string; nom: string } | null>(null);

  async function handleConfirmDeleteFichier() {
    if (!fichierToDelete) return;
    try {
      await onDelete(fichierToDelete.id);
      toast({ title: "Fichier supprimé", description: fichierToDelete.nom });
    } catch (e) {
      toast({
        title: "Suppression impossible",
        description: e instanceof Error ? e.message : "Erreur inattendue.",
        variant: "destructive",
      });
    } finally {
      setFichierToDelete(null);
    }
  }

  function uploadSelectedFiles(fileList: FileList | null) {
    if (!fileList) return;
    Array.from(fileList).forEach((file) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          title: "Fichier trop volumineux",
          description: `${file.name} dépasse la limite de ${MAX_FILE_SIZE_MB} Mo.`,
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        onUpload({
          dossierId,
          sousDossierId,
          nom: file.name,
          taille: file.size,
          type: file.type || "application/octet-stream",
          dataUrl: ev.target?.result as string,
        });
        toast({ title: "Fichier ajouté", description: file.name });
      };
      reader.readAsDataURL(file);
    });
  }

  function handleDownload(f: DossierFichier) {
    const a = document.createElement("a");
    a.href = f.dataUrl;
    a.download = f.nom;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="space-y-3">
      {canWrite && (
      <div
        role="button"
        tabIndex={0}
        aria-label="Cliquer ou déposer des fichiers ici"
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/60",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          uploadSelectedFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <Upload className={cn("size-7", dragging ? "text-primary" : "text-slate-300 dark:text-slate-700")} />
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Glissez vos PDF ici</p>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            ou cliquez pour sélectionner · Max {MAX_FILE_SIZE_MB} Mo par fichier
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(e) => {
            uploadSelectedFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      )}

      {fichiers.length > 0 ? (
        <div className="space-y-1.5">
          {fichiers.map((f) => {
            const Icon = getFileIconComponent(f.type);
            return (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2.5 dark:bg-slate-900"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Icon className="size-3.5 text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.nom}</p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(f.taille)} · {formatDateShort(f.dateUpload)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => handleDownload(f)}>
                    <Download className="size-3.5" />
                  </Button>
                  {canWrite && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      onClick={() => setFichierToDelete({ id: f.id, nom: f.nom })}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-xs text-slate-400">Aucun fichier pour l&apos;instant</p>
      )}

      <ConfirmDeleteDialog
        open={!!fichierToDelete}
        onOpenChange={(v) => !v && setFichierToDelete(null)}
        title="Supprimer ce fichier ?"
        description={
          <>Le fichier « {fichierToDelete?.nom} » sera définitivement supprimé.</>
        }
        onConfirm={handleConfirmDeleteFichier}
      />
    </div>
  );
}

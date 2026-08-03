"use client";

import { useRef, useState, type ReactNode } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { formatDateShort } from "@/lib/format";
import { formatFileSize, getFileIconComponent } from "@/lib/file-utils";
import { useToast } from "@/hooks/use-toast";
import { toastError } from "@/lib/toast-error";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EntityFileItem = {
  id: string;
  nom: string;
  taille: number;
  type: string;
  dateUpload: string;
};

export type EntityFilePayload = {
  nom: string;
  taille: number;
  type: string;
  dataUrl: string;
};

export type EntityFileDropZoneLabels = {
  dropTitle: string;
  dropSubtitle: string;
  empty: string;
  added: string;
  deleted: string;
  deleteDialogTitle: string;
  deleteDialogDescription: (nom: string) => ReactNode;
  ariaDrop: string;
};

export function EntityFileDropZone<T extends EntityFileItem>({
  files,
  canWrite = true,
  maxBytes,
  maxMbLabel,
  labels,
  onUpload,
  onDelete,
  onOpen,
}: {
  files: T[];
  canWrite?: boolean;
  maxBytes: number;
  maxMbLabel: string | number;
  labels: EntityFileDropZoneLabels;
  onUpload: (payload: EntityFilePayload) => void | Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpen: (file: T) => void | Promise<void>;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fichierToDelete, setFichierToDelete] = useState<{ id: string; nom: string } | null>(null);

  async function handleConfirmDelete() {
    if (!fichierToDelete) return;
    try {
      await onDelete(fichierToDelete.id);
      toast({ title: labels.deleted, description: fichierToDelete.nom });
    } catch (e) {
      toastError(toast, e, "Erreur inattendue.", "Suppression impossible");
    } finally {
      setFichierToDelete(null);
    }
  }

  function uploadSelectedFiles(fileList: FileList | null) {
    if (!fileList) return;
    Array.from(fileList).forEach((file) => {
      if (file.size > maxBytes) {
        toast({
          title: "Fichier trop volumineux",
          description: `${file.name} dépasse la limite de ${maxMbLabel} Mo.`,
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          await onUpload({
            nom: file.name,
            taille: file.size,
            type: file.type || "application/octet-stream",
            dataUrl: ev.target?.result as string,
          });
          toast({ title: labels.added, description: file.name });
        } catch (e) {
          toastError(toast, e, "Erreur inattendue.", "Échec de l'upload");
        }
      };
      reader.readAsDataURL(file);
    });
  }

  return (
    <div className="space-y-3">
      {canWrite && (
        <div
          role="button"
          tabIndex={0}
          aria-label={labels.ariaDrop}
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
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{labels.dropTitle}</p>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{labels.dropSubtitle}</p>
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

      {files.length > 0 ? (
        <div className="space-y-1.5">
          {files.map((f) => {
            const Icon = getFileIconComponent(f.type);
            return (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2.5 dark:bg-slate-900"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <Icon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{f.nom}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatFileSize(f.taille)} · {formatDateShort(f.dateUpload)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label={`Ouvrir ${f.nom}`}
                    onClick={() => void onOpen(f)}
                  >
                    <Download className="size-3.5" />
                  </Button>
                  {canWrite && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      aria-label={`Supprimer ${f.nom}`}
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
        <p className="py-2 text-center text-xs text-slate-400 dark:text-slate-500 sm:text-sm">{labels.empty}</p>
      )}

      <ConfirmDeleteDialog
        open={!!fichierToDelete}
        onOpenChange={(v) => !v && setFichierToDelete(null)}
        title={labels.deleteDialogTitle}
        description={
          fichierToDelete ? labels.deleteDialogDescription(fichierToDelete.nom) : null
        }
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

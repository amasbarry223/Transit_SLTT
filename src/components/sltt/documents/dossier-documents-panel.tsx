"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  Replace,
  Trash2,
  ScanText,
  History,
  Pencil,
  Loader2,
} from "lucide-react";
import type { SlttDocument, DocumentVersion } from "@/lib/domain-types";
import { useStore } from "@/lib/store";
import { usePermission } from "@/hooks/use-permission";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";
import { formatDateShort } from "@/lib/format";
import { formatFileSize } from "@/lib/file-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { DocumentUploadZone, type DocumentUploadFile } from "./document-upload-zone";
import { DocumentViewer } from "./document-viewer";
import { DocumentMetaForm, type DocumentMetaValues } from "./document-meta-form";

export function DossierDocumentsPanel({
  dossierId,
  clientId,
  onStartOcr,
}: {
  dossierId: string;
  clientId?: string;
  onStartOcr?: (documentId: string) => void;
}) {
  const { toast } = useToast();
  const canWrite = usePermission("documents:write");
  const canWriteDossiers = usePermission("dossiers:write");
  /** Lancer l'OCR = documents:write ; valider vers dossier = dossiers:write. */
  const canStartOcr = canWrite;
  const documents = useStore((s) => s.documents);
  const documentVersions = useStore((s) => s.documentVersions);
  const addDocument = useStore((s) => s.addDocument);
  const replaceDocumentVersion = useStore((s) => s.replaceDocumentVersion);
  const updateDocumentMeta = useStore((s) => s.updateDocumentMeta);
  const deleteDocument = useStore((s) => s.deleteDocument);
  const getSignedDocumentUrl = useStore((s) => s.getSignedDocumentUrl);
  const getDocumentVersions = useStore((s) => s.getDocumentVersions);

  const dossierDocs = documents.filter((d) => d.dossierId === dossierId);

  const [preview, setPreview] = useState<{
    doc: SlttDocument;
    url: string;
    version?: DocumentVersion;
  } | null>(null);
  const [editMeta, setEditMeta] = useState<{
    doc: SlttDocument;
    values: DocumentMetaValues;
  } | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<SlttDocument | null>(null);
  const [historyDoc, setHistoryDoc] = useState<SlttDocument | null>(null);
  const [historyVersions, setHistoryVersions] = useState<DocumentVersion[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SlttDocument | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleUpload(files: DocumentUploadFile[]) {
    for (const f of files) {
      try {
        await addDocument({
          nom: f.nom,
          categorie: f.categorie,
          taille: f.taille,
          mimeType: f.mimeType,
          dataUrl: f.dataUrl,
          dossierId,
          clientId,
          entityType: "dossier",
          entityId: dossierId,
        });
        toastSuccess(toast, { title: "Document ajouté", description: f.nom });
      } catch (e) {
        toastError(toast, e, { title: "Upload impossible", fallback: "Erreur" });
      }
    }
  }

  async function openPreview(doc: SlttDocument) {
    setBusyId(doc.id);
    try {
      let version = documentVersions.find(
        (v) => v.documentId === doc.id && v.version === doc.currentVersion,
      );
      if (!version) {
        const versions = await getDocumentVersions(doc.id);
        version = versions.find((v) => v.version === doc.currentVersion);
      }
      if (!version) throw new Error("Version introuvable");
      const url = await getSignedDocumentUrl(version.storagePath);
      setPreview({ doc, url, version });
    } catch (e) {
      toastError(toast, e, { title: "Aperçu impossible", fallback: "Erreur" });
    } finally {
      setBusyId(null);
    }
  }

  async function openHistory(doc: SlttDocument) {
    setBusyId(doc.id);
    try {
      const versions = await getDocumentVersions(doc.id);
      setHistoryDoc(doc);
      setHistoryVersions(versions);
    } catch (e) {
      toastError(toast, e, { title: "Historique indisponible", fallback: "Erreur" });
    } finally {
      setBusyId(null);
    }
  }

  async function handleReplace(files: DocumentUploadFile[]) {
    if (!replaceTarget || files.length === 0) return;
    const f = files[0];
    try {
      await replaceDocumentVersion(replaceTarget.id, {
        nom: f.nom,
        taille: f.taille,
        mimeType: f.mimeType,
        dataUrl: f.dataUrl,
      });
      toastSuccess(toast, { title: "Nouvelle version enregistrée", description: `v${replaceTarget.currentVersion + 1}` });
      setReplaceTarget(null);
    } catch (e) {
      toastError(toast, e, { title: "Remplacement impossible", fallback: "Erreur" });
    }
  }

  async function saveMeta() {
    if (!editMeta) return;
    try {
      await updateDocumentMeta(editMeta.doc.id, {
        nom: editMeta.values.nom,
        categorie: editMeta.values.categorie,
      });
      toastSuccess(toast, { title: "Métadonnées mises à jour" });
      setEditMeta(null);
    } catch (e) {
      toastError(toast, e, { title: "Enregistrement impossible", fallback: "Erreur" });
    }
  }

  return (
    <div className="space-y-4">
      <DocumentUploadZone onUpload={handleUpload} canWrite={canWrite} />

      {dossierDocs.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun document versionné pour ce dossier.</p>
      ) : (
        <ul className="space-y-2">
          {dossierDocs.map((doc) => (
            <Card
              key={doc.id}
              className="flex flex-col gap-3 border-border/80 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {doc.nom}
                </p>
                <p className="text-xs text-slate-500">
                  {doc.categorie} · v{doc.currentVersion} · {formatFileSize(doc.taille)} ·{" "}
                  {formatDateShort(doc.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyId === doc.id}
                  onClick={() => void openPreview(doc)}
                  title="Aperçu"
                >
                  {busyId === doc.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
                {canWrite && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setEditMeta({
                          doc,
                          values: { nom: doc.nom, categorie: doc.categorie },
                        })
                      }
                      title="Métadonnées"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplaceTarget(doc)}
                      title="Remplacer"
                    >
                      <Replace className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void openHistory(doc)}
                      title="Versions"
                    >
                      <History className="size-4" />
                    </Button>
                    {onStartOcr && canStartOcr && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onStartOcr(doc.id)}
                        title={
                          canWriteDossiers
                            ? "OCR — extraire vers le dossier"
                            : "OCR — extraction (validation dossier : dossiers:write requis)"
                        }
                      >
                        <ScanText className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(doc)}
                      title="Supprimer"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </ul>
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{preview?.doc.nom}</DialogTitle>
          </DialogHeader>
          {preview && (
            <DocumentViewer
              url={preview.url}
              mimeType={preview.doc.mimeType}
              fileName={preview.doc.nom}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editMeta} onOpenChange={(o) => !o && setEditMeta(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Métadonnées</DialogTitle>
          </DialogHeader>
          {editMeta && (
            <DocumentMetaForm
              values={editMeta.values}
              onChange={(values) => setEditMeta({ ...editMeta, values })}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMeta(null)}>
              Annuler
            </Button>
            <Button onClick={() => void saveMeta()}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!replaceTarget} onOpenChange={(o) => !o && setReplaceTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remplacer « {replaceTarget?.nom} »</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            Une nouvelle version sera créée. L&apos;historique des versions précédentes est
            conservé.
          </p>
          <DocumentUploadZone onUpload={handleReplace} canWrite={canWrite} multiple={false} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyDoc} onOpenChange={(o) => !o && setHistoryDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Versions — {historyDoc?.nom}</DialogTitle>
          </DialogHeader>
          <ul className="space-y-2">
            {historyVersions.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span>
                  v{v.version} · {formatFileSize(v.taille)} · {formatDateShort(v.createdAt)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const url = await getSignedDocumentUrl(v.storagePath);
                      if (historyDoc) setPreview({ doc: historyDoc, url, version: v });
                    } catch (e) {
                      toastError(toast, e, { title: "Aperçu impossible", fallback: "Erreur" });
                    }
                  }}
                >
                  Voir
                </Button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Supprimer ce document ?"
        description={
          deleteTarget
            ? `« ${deleteTarget.nom} » et toutes ses versions seront définitivement supprimés.`
            : ""
        }
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteDocument(deleteTarget.id);
            toastSuccess(toast, { title: "Document supprimé" });
          } catch (e) {
            toastError(toast, e, { title: "Suppression impossible", fallback: "Erreur" });
          } finally {
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}

/** Hook léger pour précharger les versions d'un dossier si besoin. */
export function useDossierDocumentsWarmup(dossierId: string) {
  const getDocumentVersions = useStore((s) => s.getDocumentVersions);
  const documents = useStore((s) => s.documents);
  useEffect(() => {
    const docs = documents.filter((d) => d.dossierId === dossierId);
    docs.slice(0, 5).forEach((d) => {
      void getDocumentVersions(d.id).catch(() => undefined);
    });
  }, [dossierId, documents, getDocumentVersions]);
}

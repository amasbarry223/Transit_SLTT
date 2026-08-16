"use client";

import { useRef, useState } from "react";
import { DatabaseBackup, Download, Upload, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { BackupExportPayload } from "@/lib/store/backup-slice";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";

import { backupRestoreSchema } from "@/lib/schemas/store-inputs";
import { zodErrorMessage } from "@/lib/api/schemas";
import { formatFileSize } from "@/lib/file-utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DangerConfirmDialog } from "@/components/sltt/danger-confirm-dialog";

const WIPE_CONFIRM_PHRASE = "SUPPRIMER TOUT";
const RESTORE_CONFIRM_PHRASE = "RESTAURER";

function totalRows(report: Record<string, number>): number {
  return Object.values(report).reduce((sum, n) => sum + n, 0);
}

function downloadJson(payload: unknown, fileName: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function BackupTab() {
  const { toast } = useToast();
  const exportBackup = useStore((s) => s.exportBackup);
  const wipeBusinessData = useStore((s) => s.wipeBusinessData);
  const restoreBackup = useStore((s) => s.restoreBackup);
  const clients = useStore((s) => s.clients);
  const dossiers = useStore((s) => s.dossiers);
  const factures = useStore((s) => s.factures);
  const devis = useStore((s) => s.devis);
  const ecritures = useStore((s) => s.ecritures);
  const documents = useStore((s) => s.documents);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<{
    fileName: string;
    data: Record<string, unknown[]>;
    tableCount: number;
    rowCount: number;
  } | null>(null);
  const [wipeDialogOpen, setWipeDialogOpen] = useState(false);

  const currentSnapshot = [
    `${clients.length} client${clients.length !== 1 ? "s" : ""}`,
    `${dossiers.length} dossier${dossiers.length !== 1 ? "s" : ""}`,
    `${factures.length} facture${factures.length !== 1 ? "s" : ""}`,
    `${devis.length} devis`,
    `${ecritures.length} écriture${ecritures.length !== 1 ? "s" : ""} comptable${ecritures.length !== 1 ? "s" : ""}`,
    `${documents.length} document${documents.length !== 1 ? "s" : ""}`,
  ];

  async function handleExport() {
    setExporting(true);
    try {
      const payload = (await exportBackup()) as BackupExportPayload;
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
      const json = JSON.stringify(payload);
      downloadJson(payload, `sauvegarde-sltt-${stamp}.json`);
      toastSuccess(toast, { title: "Sauvegarde exportée", description: `${payload.meta.tables.length} table(s) — ${formatFileSize(new Blob([json]).size)}.` });
    } catch (e) {
      toastError(toast, e, { title: "Export impossible", fallback: "Erreur lors de l'export." });
    } finally {
      setExporting(false);
    }
  }

  async function handleFileSelected(file: File) {
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const parsed = backupRestoreSchema.safeParse(raw);
      if (!parsed.success) {
        throw new Error(zodErrorMessage(parsed.error));
      }
      const { data } = parsed.data;
      const tableCount = Object.keys(data).length;
      const rowCount = Object.values(data).reduce(
        (sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0),
        0,
      );
      setPendingRestore({ fileName: file.name, data, tableCount, rowCount });
    } catch (e) {
      toastError(toast, e, { title: "Fichier illisible", fallback: "Impossible de lire ce fichier de sauvegarde." });
    }
  }

  async function handleConfirmRestore() {
    if (!pendingRestore) return;
    try {
      const { restored, missingTables } = await restoreBackup(pendingRestore.data);
      if (missingTables.length > 0) {
        toastWarning(toast, {
          title: "Restauration partielle",
          description: `${totalRows(restored)} ligne(s) restaurée(s) sur ${Object.keys(restored).length} table(s). Absentes du fichier (restées vides) : ${missingTables.join(", ")}.`,
        });
      } else {
        toastSuccess(toast, { title: "Restauration terminée", description: `${totalRows(restored)} ligne(s) restaurée(s) sur ${Object.keys(restored).length} table(s).` });
      }
    } catch (e) {
      toastError(toast, e, { title: "Restauration impossible", fallback: "Erreur lors de la restauration." });
    } finally {
      setPendingRestore(null);
    }
  }

  async function handleConfirmWipe() {
    try {
      const report = await wipeBusinessData();
      toastSuccess(toast, { title: "Données supprimées", description: `${totalRows(report)} ligne(s) supprimée(s) sur ${Object.keys(report).length} table(s).` });
    } catch (e) {
      toastError(toast, e, { title: "Suppression impossible", fallback: "Erreur lors de la suppression." });
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Sauvegarde, restauration et suppression complète des données métier (dossiers, clients,
        factures, comptabilité…). Les comptes utilisateurs, sociétés et annexes ne sont jamais
        touchés par ces actions.
      </p>

      <Card className="p-6 shadow-sm border-border/80">
        <div className="flex items-center gap-2">
          <DatabaseBackup className="size-4 text-slate-500 dark:text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Exporter une sauvegarde
          </h3>
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Télécharge un fichier .json contenant l&apos;intégralité des données métier actuelles.
          Réimportable depuis cet écran pour restaurer l&apos;état exact au moment de l&apos;export.
        </p>
        <Button className="mt-4" onClick={() => void handleExport()} disabled={exporting}>
          {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {exporting ? "Export en cours…" : "Exporter maintenant"}
        </Button>
      </Card>

      <Card className="p-6 shadow-sm border-border/80">
        <div className="flex items-center gap-2">
          <Upload className="size-4 text-slate-500 dark:text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Importer une sauvegarde
          </h3>
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Remplace <strong>toutes</strong> les données métier actuelles par celles d&apos;un fichier
          exporté précédemment. Les données en cours seront d&apos;abord entièrement effacées.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFileSelected(file);
            e.target.value = "";
          }}
        />
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="size-4" />
          Choisir un fichier de sauvegarde
        </Button>
      </Card>

      <Card className="border-red-200 bg-red-50/40 p-6 shadow-sm dark:border-red-900/60 dark:bg-red-950/20">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
          <h3 className="text-sm font-semibold text-red-900 dark:text-red-300">Zone dangereuse</h3>
        </div>
        <p className="mt-2 text-sm text-red-800/90 dark:text-red-300/80">
          Supprime définitivement toutes les données métier (dossiers, clients, factures,
          comptabilité, stock, contrats, archives, documents…). Cette action est irréversible —
          exportez une sauvegarde avant de continuer si vous n&apos;êtes pas certain.
        </p>
        <Button
          variant="destructive"
          className="mt-4"
          onClick={() => setWipeDialogOpen(true)}
        >
          <Trash2 className="size-4" />
          Supprimer toutes les données
        </Button>
      </Card>

      <DangerConfirmDialog
        open={!!pendingRestore}
        onOpenChange={(v) => !v && setPendingRestore(null)}
        title="Restaurer cette sauvegarde ?"
        description={
          pendingRestore
            ? `Le fichier « ${pendingRestore.fileName} » contient ${pendingRestore.rowCount} ligne(s) sur ${pendingRestore.tableCount} table(s). Les données actuelles ci-dessous seront intégralement remplacées.`
            : ""
        }
        consequences={currentSnapshot.map((s) => `Actuellement en base — ${s} — sera supprimé.`)}
        confirmPhrase={RESTORE_CONFIRM_PHRASE}
        confirmLabel="Effacer et restaurer"
        onConfirm={handleConfirmRestore}
      />

      <DangerConfirmDialog
        open={wipeDialogOpen}
        onOpenChange={setWipeDialogOpen}
        title="Supprimer toutes les données métier ?"
        description="Cette action est irréversible. Les comptes utilisateurs, sociétés et annexes seront conservés ; tout le reste sera définitivement effacé."
        consequences={currentSnapshot}
        confirmPhrase={WIPE_CONFIRM_PHRASE}
        confirmLabel="Supprimer définitivement"
        onConfirm={handleConfirmWipe}
      />
    </div>
  );
}

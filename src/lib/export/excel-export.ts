"use client";

import type { AuditModule } from "@/lib/audit";
import { fetchWithAuth } from "@/lib/api/fetch-auth";
import { normalizeExportCell } from "@/lib/export/normalize-export-cell";
import { buildXlsxBlob } from "@/lib/export/build-xlsx-client";
import type { ExportModule } from "@/lib/export/export-modules";
import { useStore } from "@/lib/store";
import { toast } from "@/hooks/use-toast";
import { toastError, toastLoading, toastSuccess } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";
import { logError } from "@/shared/logger";

interface Column<T> {
  header: string;
  accessor: (row: T) => string | number;
}

/**
 * Neutralise les caractères interdits dans un nom de fichier (Windows/macOS/Linux)
 * — évite un échec silencieux du téléchargement quand le nom vient d'un texte libre.
 */
function sanitizeFilename(name: string): string {
  const safe = name
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
  return safe || "export";
}

/** Télécharge un blob via `<a download>` — conserve le nom .xlsx et le contenu. */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 4000);
}

/**
 * Export tabulaire .xlsx : le serveur ne fait qu'autoriser l'export (permission
 * du module) — les données sont déjà en mémoire côté client, donc le fichier
 * est construit et téléchargé directement dans le navigateur, sans faire
 * transiter tout le jeu de lignes par le réseau dans un sens puis dans l'autre.
 * Ne se replie jamais sur un CSV : en cas d'échec, une erreur est levée et
 * l'appelant ne doit pas afficher de message de succès (voir chaque écran).
 *
 * Le téléchargement passe toujours par `<a download="…xlsx">` déclenché en
 * JS — ça ne rouvre pas d'onglet ni ne nécessite de fenêtre intermédiaire.
 */
export async function exportToExcel<T>(
  module: ExportModule,
  filename: string,
  columns: Column<T>[],
  rows: T[],
  audit?: { module: AuditModule },
): Promise<void> {
  if (rows.length === 0) return;

  // Retour visuel immédiat : la vérification de permission puis la
  // construction du classeur peuvent prendre le temps de l'aller-retour
  // réseau (léger) et du calcul ExcelJS sur de gros exports, sans que rien
  // ne bouge à l'écran sinon — perçu comme un blocage.
  const progress = toastLoading(toast, {
    title: "Génération du fichier Excel…",
    description: UI.loading.exporting,
  });

  const baseName = sanitizeFilename(filename.replace(/\.(csv|xls|xlsx)$/i, ""));

  try {
    const response = await fetchWithAuth("/api/export/excel", {
      method: "POST",
      body: JSON.stringify({ module }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(payload?.error ?? "Export Excel impossible.");
    }

    const headers = columns.map((c) => c.header);
    const data = rows.map((row) =>
      columns.map((c) => normalizeExportCell(c.accessor(row))),
    );
    const blob = await buildXlsxBlob(headers, data);
    downloadBlob(blob, `${baseName}.xlsx`);
    progress.dismiss();

    if (audit) {
      void useStore.getState().addAuditLog(
        audit.module,
        "Export",
        `Export ${baseName} — ${rows.length} ligne${rows.length !== 1 ? "s" : ""}`,
      );
    }
  } catch (error) {
    progress.dismiss();
    logError("[SLTT] Export Excel", error);
    toastError(toast, error, {
      title: "Export Excel impossible",
      fallback: UI.errors.exportFailed,
    });
    throw error;
  }
}
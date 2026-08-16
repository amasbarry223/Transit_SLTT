"use client";

import type { AuditModule } from "@/lib/audit";
import { fetchWithAuth } from "@/lib/api/fetch-auth";
import { normalizeExportCell } from "@/lib/export/normalize-export-cell";
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

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

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

/** Valide la signature ZIP (PK) et la présence du répertoire central — détecte un flux tronqué. */
function isValidXlsxBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 22 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) return false;
  const eocdSig = [0x50, 0x4b, 0x05, 0x06];
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i--) {
    if (
      bytes[i] === eocdSig[0] &&
      bytes[i + 1] === eocdSig[1] &&
      bytes[i + 2] === eocdSig[2] &&
      bytes[i + 3] === eocdSig[3]
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Export tabulaire .xlsx via l'API serveur (ExcelJS Node.js).
 * Ne se replie jamais sur un CSV : en cas d'échec, une erreur est levée et
 * l'appelant ne doit pas afficher de message de succès (voir chaque écran).
 *
 * Le téléchargement passe toujours par `<a download="…xlsx">` pour garantir
 * le nom de fichier et le contenu. Un onglet synchrone est ouvert pendant le
 * geste de clic (filet anti-bloqueur) puis refermé — il ne sert jamais de
 * destination du blob.
 */
export async function exportToExcel<T>(
  module: ExportModule,
  filename: string,
  columns: Column<T>[],
  rows: T[],
  audit?: { module: AuditModule },
): Promise<void> {
  if (rows.length === 0) return;

  // Retour visuel immédiat : le mapping synchrone des lignes ci-dessous puis
  // l'aller-retour réseau peuvent prendre 1-3s sur de gros exports sans que
  // rien ne bouge à l'écran sinon — perçu comme un blocage.
  const progress = toastLoading(toast, {
    title: "Génération du fichier Excel…",
    description: UI.loading.exporting,
  });

  // Claim le geste utilisateur de façon synchrone (certains navigateurs
  // sinon bloquent le téléchargement après l'await fetch).
  const downloadTab =
    typeof window !== "undefined" ? window.open("", "_blank") : null;

  const baseName = sanitizeFilename(filename.replace(/\.(csv|xls|xlsx)$/i, ""));
  const headers = columns.map((c) => c.header);
  const data = rows.map((row) =>
    columns.map((c) => normalizeExportCell(c.accessor(row))),
  );

  try {
    const response = await fetchWithAuth("/api/export/excel", {
      method: "POST",
      body: JSON.stringify({ module, filename: baseName, headers, rows: data }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(payload?.error ?? "Export Excel impossible.");
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!isValidXlsxBytes(bytes)) {
      throw new Error(
        "Réponse serveur invalide ou tronquée — le fichier n'est pas un Excel valide.",
      );
    }

    const blob = new Blob([bytes], { type: XLSX_MIME });
    downloadBlob(blob, `${baseName}.xlsx`);
    downloadTab?.close();
    progress.dismiss();

    if (audit) {
      void useStore.getState().addAuditLog(
        audit.module,
        "Export",
        `Export ${baseName} — ${rows.length} ligne${rows.length !== 1 ? "s" : ""}`,
      );
    }
  } catch (error) {
    downloadTab?.close();
    progress.dismiss();
    logError("[SLTT] Export Excel", error);
    toastError(toast, error, {
      title: "Export Excel impossible",
      fallback: UI.errors.exportFailed,
    });
    throw error;
  }
}
"use client";

import type { AuditModule } from "@/lib/audit";
import { useStore } from "@/lib/store";

interface Column<T> {
  header: string;
  accessor: (row: T) => string | number;
}

function downloadBlob(blob: Blob, filename: string): void {
  const nav = window.navigator as Navigator & {
    msSaveOrOpenBlob?: (b: Blob, name: string) => void;
  };
  if (nav.msSaveOrOpenBlob) {
    nav.msSaveOrOpenBlob(blob, filename);
    return;
  }
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

function csvCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  // Neutralise l'injection de formule Excel/LibreOffice (OWASP CSV Injection) :
  // préfixe d'une apostrophe toute valeur commençant par =, +, -, @, tab ou CR.
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  if (/[",\n;\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function encodeCsvForExcel(text: string): Blob {
  const bytes = new TextEncoder().encode(`\uFEFF${text}`);
  return new Blob([bytes], { type: "text/csv;charset=utf-8;" });
}

/** Construit le blob CSV (UTF-8 BOM) — exposé pour les tests unitaires. */
export function buildCsvBlob<T>(
  columns: Column<T>[],
  rows: T[],
): Blob {
  const headerLine = columns.map((c) => csvCell(c.header)).join(";");
  const dataLines = rows.map((row) =>
    columns.map((c) => csvCell(c.accessor(row))).join(";"),
  );
  const csvText = `sep=;\r\n${[headerLine, ...dataLines].join("\r\n")}`;
  return encodeCsvForExcel(csvText);
}

/**
 * Export tabulaire compatible Excel (séparateur ;, encodage UTF-8 BOM).
 * Ouvre correctement dans Excel Windows avec accents et colonnes séparées.
 */
export function exportToCSV<T>(
  filename: string,
  columns: Column<T>[],
  rows: T[],
  audit?: { module: AuditModule },
): void {
  if (rows.length === 0) return;

  const baseName = filename.replace(/\.(csv|xls|xlsx)$/i, "");
  downloadBlob(buildCsvBlob(columns, rows), `${baseName}.csv`);

  if (audit) {
    void useStore.getState().addAuditLog(
      audit.module,
      "Export",
      `Export ${baseName} — ${rows.length} ligne${rows.length !== 1 ? "s" : ""}`,
    );
  }
}

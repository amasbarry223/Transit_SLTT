/**
 * Import/export .xlsx via ExcelJS (téléchargement / upload fichier).
 * Le snapshot live reste le JSON Univer (save()).
 */

import type { GrandLivreRow } from "@/lib/excel/sltt-bridge";
import { GRAND_LIVRE_HEADERS, GRAND_LIVRE_SHEET_NAME, NOTES_SHEET_NAME } from "@/lib/excel/template";

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 4000);
}

/** Construit un Blob .xlsx GrandLivre (sans téléchargement) — filet Storage. */
export async function buildGrandLivreXlsxBlob(
  rows: GrandLivreRow[],
  notesHint = "Notes & calculs libres",
): Promise<Blob> {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet(GRAND_LIVRE_SHEET_NAME);
  sheet.addRow([...GRAND_LIVRE_HEADERS]);
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E40AF" },
  };

  for (const r of rows) {
    sheet.addRow([
      r.date,
      r.societeNom,
      r.type,
      r.reference,
      r.libelle,
      r.debit,
      r.credit,
      r.statut,
      r.solde,
    ]);
  }

  const notes = wb.addWorksheet(NOTES_SHEET_NAME);
  notes.addRow([notesHint]);

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/** Export simple : GrandLivre (+ feuille Notes vide) vers .xlsx téléchargeable. */
export async function exportGrandLivreToXlsx(
  rows: GrandLivreRow[],
  filename: string,
  notesHint = "Notes & calculs libres",
): Promise<void> {
  const blob = await buildGrandLivreXlsxBlob(rows, notesHint);
  downloadBlob(blob, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

/** Parse un .xlsx via le parseur classeur unifié (mêmes en-têtes que Grand livre). */
export async function parseXlsxToGrandLivreRows(file: ArrayBuffer): Promise<GrandLivreRow[]> {
  const { parseClasseurXlsx } = await import("@/lib/classeur-import");
  const imported = await parseClasseurXlsx(file);
  return imported.map((r) => ({
    sheetRow: r.rowNumber,
    date: r.date,
    societeNom: r.societeNom,
    type: r.type === "all" ? "Paiement" : r.type,
    reference: r.reference,
    libelle: r.libelle,
    debit: r.debit,
    credit: r.credit,
    statut: r.statut,
    solde: 0,
  }));
}

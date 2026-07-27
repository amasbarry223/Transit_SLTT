/**
 * Import/export .xlsx via ExcelJS (téléchargement / upload fichier).
 * Le snapshot live reste le JSON Univer (save()).
 */

import ExcelJS from "exceljs";
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

/** Export simple : GrandLivre (+ feuille Notes vide) vers .xlsx téléchargeable. */
export async function exportGrandLivreToXlsx(
  rows: GrandLivreRow[],
  filename: string,
  notesHint = "Notes & calculs libres",
): Promise<void> {
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

  sheet.columns = [
    { width: 12 },
    { width: 16 },
    { width: 12 },
    { width: 16 },
    { width: 28 },
    { width: 14 },
    { width: 14 },
    { width: 12 },
    { width: 14 },
  ];

  const notes = wb.addWorksheet(NOTES_SHEET_NAME);
  notes.addRow([notesHint]);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

/** Parse un .xlsx (1re feuille ou GrandLivre) en lignes. */
export async function parseXlsxToGrandLivreRows(file: ArrayBuffer): Promise<GrandLivreRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(file);
  const sheet =
    wb.getWorksheet(GRAND_LIVRE_SHEET_NAME) ||
    wb.worksheets[0];
  if (!sheet) return [];

  const rows: GrandLivreRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const vals = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((c) => {
      const v = row.getCell(c).value;
      if (v == null) return "";
      if (typeof v === "object" && v !== null && "result" in v) {
        return String((v as { result: unknown }).result ?? "");
      }
      if (v instanceof Date) return v.toISOString().slice(0, 10);
      return String(v);
    });
    const reference = vals[3].trim();
    const libelle = vals[4].trim();
    const debit = Number(String(vals[5]).replace(/\s/g, "").replace(",", ".")) || 0;
    const credit = Number(String(vals[6]).replace(/\s/g, "").replace(",", ".")) || 0;
    if (!reference && !libelle && !debit && !credit) return;
    rows.push({
      date: vals[0],
      societeNom: vals[1],
      type: vals[2],
      reference,
      libelle,
      debit,
      credit,
      statut: vals[7],
      solde: Number(String(vals[8]).replace(/\s/g, "").replace(",", ".")) || 0,
    });
  });
  return rows;
}

"use client";

import type ExcelJS from "exceljs";
import { computeColumnWidths, sanitizeExcelCell } from "@/lib/export/xlsx-cell-utils";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE8EEF5" },
};

/**
 * Construit un classeur .xlsx directement dans le navigateur (les données sont
 * déjà en mémoire côté client — inutile de les envoyer au serveur pour les
 * récupérer ensuite reconstruites en binaire). Import dynamique d'ExcelJS pour
 * ne pas alourdir le bundle initial — même pattern que
 * `src/lib/excel/workbook-io.ts:buildGrandLivreXlsxBlob`.
 */
export async function buildXlsxBlob(
  headers: string[],
  rows: (string | number)[][],
): Promise<Blob> {
  const { default: ExcelJSLib } = await import("exceljs");
  const workbook = new ExcelJSLib.Workbook();
  const sheet = workbook.addWorksheet("Export");

  const keys = headers.map((_, i) => `c${i}`);
  const widths = computeColumnWidths(headers, rows);

  sheet.columns = headers.map((header, i) => ({
    header,
    key: keys[i],
    width: widths[i],
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = HEADER_FILL;
  headerRow.commit();

  for (const row of rows) {
    const record: Record<string, string | number> = {};
    for (let i = 0; i < keys.length; i++) {
      record[keys[i]] = sanitizeExcelCell(row[i]);
    }
    sheet.addRow(record);
  }

  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const lastCol = headers.length;
  const lastRow = rows.length + 1;
  if (lastCol > 0 && lastRow >= 1) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: lastRow, column: lastCol },
    };
  }

  const output = await workbook.xlsx.writeBuffer();
  return new Blob([output], { type: XLSX_MIME });
}

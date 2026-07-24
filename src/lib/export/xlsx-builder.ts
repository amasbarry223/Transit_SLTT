import "server-only";

import ExcelJS from "exceljs";

/** Neutralise l'injection de formule Excel/LibreOffice (OWASP CSV Injection). */
export function sanitizeExcelCell(value: unknown): string | number {
  if (value == null) return "";
  if (typeof value === "number" && Number.isFinite(value)) return value;

  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  return s;
}

/** Génère un buffer .xlsx (OOXML) — à utiliser côté serveur Node.js uniquement. */
export async function buildXlsxBuffer(
  headers: string[],
  rows: (string | number)[][],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Export");

  sheet.columns = headers.map((header) => ({
    width: Math.max(12, header.length + 2),
  }));

  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true };

  for (const row of rows) {
    sheet.addRow(row.map(sanitizeExcelCell));
  }

  const output = await workbook.xlsx.writeBuffer();
  return Buffer.from(output);
}

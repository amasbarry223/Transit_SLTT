import "server-only";

import ExcelJS from "exceljs";

const MIN_COL_WIDTH = 12;
const MAX_COL_WIDTH = 48;
const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE8EEF5" },
};

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

function cellDisplayLength(value: string | number): number {
  return String(value).length;
}

function computeColumnWidths(
  headers: string[],
  rows: (string | number)[][],
): number[] {
  return headers.map((header, colIndex) => {
    let maxLen = header.length;
    for (const row of rows) {
      const cell = row[colIndex];
      if (cell != null) {
        maxLen = Math.max(maxLen, cellDisplayLength(cell));
      }
    }
    return Math.min(MAX_COL_WIDTH, Math.max(MIN_COL_WIDTH, maxLen + 2));
  });
}

/** Génère un buffer .xlsx (OOXML) — à utiliser côté serveur Node.js uniquement. */
export async function buildXlsxBuffer(
  headers: string[],
  rows: (string | number)[][],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
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
  return Buffer.from(output);
}

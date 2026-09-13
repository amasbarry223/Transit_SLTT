const MIN_COL_WIDTH = 12;
const MAX_COL_WIDTH = 48;

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

export function computeColumnWidths(
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

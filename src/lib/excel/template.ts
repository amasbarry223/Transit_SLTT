/** Template Univer IWorkbookData — feuilles GrandLivre + Notes. */

export const GRAND_LIVRE_SHEET_NAME = "GrandLivre";
export const NOTES_SHEET_NAME = "Notes";

export const GRAND_LIVRE_HEADERS = [
  "Date",
  "Société",
  "Type",
  "Référence",
  "Libellé",
  "Débit",
  "Crédit",
  "Statut",
  "Solde",
] as const;

const HEADER_STYLE = {
  bl: "1E40AF",
  cl: { rgb: "#FFFFFF" },
  ht: 2, // center
  vt: 2,
};

function headerCellData(): Record<number, { v: string; s?: typeof HEADER_STYLE }> {
  const row: Record<number, { v: string; s?: typeof HEADER_STYLE }> = {};
  GRAND_LIVRE_HEADERS.forEach((h, i) => {
    row[i] = { v: h, s: HEADER_STYLE };
  });
  return row;
}

export function buildEmptyWorkbookData(clientNom: string): Record<string, unknown> {
  const grandLivreId = "sheet-grandlivre";
  const notesId = "sheet-notes";

  return {
    id: `wb-sltt-${Date.now()}`,
    name: `Classeur ${clientNom}`,
    appVersion: "0.25.1",
    locale: "frFR",
    styles: {},
    sheetOrder: [grandLivreId, notesId],
    sheets: {
      [grandLivreId]: {
        id: grandLivreId,
        name: GRAND_LIVRE_SHEET_NAME,
        rowCount: 2000,
        columnCount: 12,
        defaultRowHeight: 24,
        defaultColumnWidth: 110,
        freeze: { startRow: 1, startColumn: 0, ySplit: 1, xSplit: 0 },
        cellData: {
          0: headerCellData(),
          1: {
            0: { v: "Utilisez « Actualiser depuis SLTT » pour injecter le journal." },
          },
        },
        columnData: {
          0: { w: 100 },
          1: { w: 130 },
          2: { w: 90 },
          3: { w: 130 },
          4: { w: 220 },
          5: { w: 110 },
          6: { w: 110 },
          7: { w: 100 },
          8: { w: 110 },
        },
      },
      [notesId]: {
        id: notesId,
        name: NOTES_SHEET_NAME,
        rowCount: 100,
        columnCount: 10,
        defaultRowHeight: 24,
        defaultColumnWidth: 120,
        freeze: { startRow: 0, startColumn: 0, ySplit: 0, xSplit: 0 },
        cellData: {
          0: {
            0: { v: "Notes & calculs libres (non synchronisés avec SLTT)" },
          },
        },
      },
    },
  };
}

/** Agrandit GrandLivre sur les anciens snapshots (rowCount 200 → 2000). */
export function ensureGrandLivreCapacity(
  workbookData: Record<string, unknown>,
  minRows = 2000,
): Record<string, unknown> {
  const sheets = workbookData.sheets;
  if (!sheets || typeof sheets !== "object") return workbookData;

  for (const sheet of Object.values(sheets as Record<string, Record<string, unknown>>)) {
    if (!sheet || typeof sheet !== "object") continue;
    const name = sheet.name;
    const id = sheet.id;
    if (name === GRAND_LIVRE_SHEET_NAME || id === "sheet-grandlivre") {
      const current = Number(sheet.rowCount) || 0;
      if (current < minRows) sheet.rowCount = minRows;
      const cols = Number(sheet.columnCount) || 0;
      if (cols < 12) sheet.columnCount = 12;
    }
  }
  return workbookData;
}

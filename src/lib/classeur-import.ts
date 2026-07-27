/**
 * Import .xlsx → lignes classeur (ExcelJS côté client).
 * Colonnes attendues : Date, Société, Type, Référence, Libellé, Débit, Crédit, Statut[, Solde]
 */

import ExcelJS from "exceljs";
import type { ClasseurType } from "@/lib/classeur";
import { GRAND_LIVRE_HEADERS, GRAND_LIVRE_SHEET_NAME } from "@/lib/excel/template";

export type ClasseurImportRow = {
  date: string;
  societeNom: string;
  type: ClasseurType | "all";
  reference: string;
  libelle: string;
  debit: number;
  credit: number;
  statut: string;
  /** Index 1-based dans le fichier (pour messages d'erreur). */
  rowNumber: number;
};

/** Clés déjà normalisées (sans accents, minuscules). */
const HEADER_ALIASES: Record<string, keyof Omit<ClasseurImportRow, "rowNumber"> | "solde"> = {
  date: "date",
  societe: "societeNom",
  company: "societeNom",
  type: "type",
  reference: "reference",
  ref: "reference",
  "n reference": "reference",
  "no reference": "reference",
  "numero reference": "reference",
  libelle: "libelle",
  label: "libelle",
  designation: "libelle",
  debit: "debit",
  credit: "credit",
  statut: "statut",
  status: "statut",
  solde: "solde",
  balance: "solde",
};

/** Ordre positionnel GrandLivre (export SLTT / Univer). */
const POSITIONAL_FIELDS: Array<keyof Omit<ClasseurImportRow, "rowNumber"> | "solde" | null> = [
  "date",
  "societeNom",
  "type",
  "reference",
  "libelle",
  "debit",
  "credit",
  "statut",
  "solde",
];

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Normalise puis mappe (gère "n reference", "montant debit", etc.). */
function resolveHeaderField(
  raw: string,
): keyof Omit<ClasseurImportRow, "rowNumber"> | "solde" | null {
  const n = normalizeHeader(raw);
  if (!n) return null;
  if (HEADER_ALIASES[n]) return HEADER_ALIASES[n];
  // Contient un alias connu (ex. "date operation")
  for (const [alias, field] of Object.entries(HEADER_ALIASES)) {
    if (n === alias || n.startsWith(`${alias} `) || n.endsWith(` ${alias}`)) {
      return field;
    }
  }
  return null;
}

function cellToString(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("richText" in v && Array.isArray((v as { richText: { text?: string }[] }).richText)) {
      return (v as { richText: { text?: string }[] }).richText.map((t) => t.text ?? "").join("");
    }
    if ("text" in v && typeof (v as { text: unknown }).text === "string") {
      return (v as { text: string }).text;
    }
    if ("result" in v) {
      return cellToString((v as { result: ExcelJS.CellValue }).result);
    }
    if ("formula" in v && "result" in v) {
      return cellToString((v as { result: ExcelJS.CellValue }).result);
    }
  }
  return String(v);
}

function parseAmount(raw: string): number {
  const n = Number(String(raw).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function parseType(raw: string): ClasseurType | "all" {
  const t = raw.trim().toLowerCase();
  if (t === "dossier") return "Dossier";
  if (t === "paiement" || t === "ecriture" || t === "écriture") return "Paiement";
  if (t === "facture") return "Facture";
  return "all";
}

function pickWorksheet(wb: ExcelJS.Workbook): ExcelJS.Worksheet | undefined {
  return (
    wb.getWorksheet(GRAND_LIVRE_SHEET_NAME) ||
    wb.worksheets.find((s) => normalizeHeader(s.name).includes("grandlivre")) ||
    wb.worksheets.find((s) => normalizeHeader(s.name).includes("grand livre")) ||
    wb.worksheets[0]
  );
}

function buildColMapFromRow(
  row: ExcelJS.Row,
): Map<number, keyof Omit<ClasseurImportRow, "rowNumber"> | "solde"> {
  const colMap = new Map<number, keyof Omit<ClasseurImportRow, "rowNumber"> | "solde">();
  row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const field = resolveHeaderField(cellToString(cell.value));
    if (field) colMap.set(colNumber, field);
  });
  return colMap;
}

function looksLikeGrandLivreHeaderRow(row: ExcelJS.Row): boolean {
  const texts: string[] = [];
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber <= 9) texts[colNumber - 1] = normalizeHeader(cellToString(cell.value));
  });
  // Au moins Date + Type/Référence + Débit/Crédit
  const joined = texts.filter(Boolean);
  if (joined.length < 3) return false;
  const expected = GRAND_LIVRE_HEADERS.map((h) => normalizeHeader(h));
  let hits = 0;
  for (let i = 0; i < expected.length; i++) {
    if (texts[i] && (texts[i] === expected[i] || resolveHeaderField(texts[i] || ""))) hits++;
  }
  return hits >= 3;
}

function positionalColMap(): Map<number, keyof Omit<ClasseurImportRow, "rowNumber"> | "solde"> {
  const colMap = new Map<number, keyof Omit<ClasseurImportRow, "rowNumber"> | "solde">();
  POSITIONAL_FIELDS.forEach((field, i) => {
    if (field) colMap.set(i + 1, field);
  });
  return colMap;
}

export async function parseClasseurXlsx(file: ArrayBuffer): Promise<ClasseurImportRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(file);
  if (!wb.worksheets.length) return [];

  const preferred = pickWorksheet(wb);
  const sheets = preferred
    ? [preferred, ...wb.worksheets.filter((s) => s !== preferred)]
    : wb.worksheets;

  let lastError: Error | null = null;
  for (const sheet of sheets) {
    try {
      const rows = parseSheet(sheet);
      if (rows.length > 0) return rows;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  if (lastError) throw lastError;
  throw new Error(
    "Aucune ligne exploitable trouvée (attendu : Date, Société, Type, Référence, Libellé, Débit, Crédit…)",
  );
}

function countFilledCells(row: ExcelJS.Row, maxCol = 12): number {
  let filled = 0;
  for (let c = 1; c <= maxCol; c++) {
    if (cellToString(row.getCell(c).value).trim()) filled++;
  }
  return filled;
}

function looksLikeDataRow(row: ExcelJS.Row): boolean {
  const date = cellToString(row.getCell(1).value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(date) || /^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}/.test(date)) {
    return true;
  }
  const debit = parseAmount(cellToString(row.getCell(6).value));
  const credit = parseAmount(cellToString(row.getCell(7).value));
  return debit > 0 || credit > 0;
}

function parseSheet(sheet: ExcelJS.Worksheet): ClasseurImportRow[] {
  let headerRowNumber = 1;
  let colMap = buildColMapFromRow(sheet.getRow(1));

  if (colMap.size < 3) {
    const maxScan = Math.max(10, Math.min(20, sheet.rowCount || 10));
    for (let r = 1; r <= maxScan; r++) {
      const row = sheet.getRow(r);
      const map = buildColMapFromRow(row);
      if (map.size >= 3 || looksLikeGrandLivreHeaderRow(row)) {
        colMap = map.size >= 3 ? map : positionalColMap();
        headerRowNumber = r;
        break;
      }
    }
  }

  if (colMap.size < 3 && looksLikeGrandLivreHeaderRow(sheet.getRow(headerRowNumber))) {
    colMap = positionalColMap();
  }

  // Fallback agressif : ligne « dense » → mapping positionnel GrandLivre.
  if (colMap.size < 3) {
    for (let r = 1; r <= Math.min(5, Math.max(1, sheet.rowCount || 1)); r++) {
      if (countFilledCells(sheet.getRow(r)) >= 4) {
        colMap = positionalColMap();
        // Si la ligne ressemble à des données (date / montants), pas d'en-tête à sauter.
        headerRowNumber = looksLikeDataRow(sheet.getRow(r)) ? 0 : r;
        break;
      }
    }
  }

  if (colMap.size < 3) {
    throw new Error(
      "En-têtes Excel non reconnus (attendu : Date, Société, Type, Référence, Libellé, Débit, Crédit…)",
    );
  }

  const rows: ClasseurImportRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowNumber) return;
    const partial: Partial<ClasseurImportRow> & { solde?: number } = { rowNumber };
    colMap.forEach((field, col) => {
      const raw = cellToString(row.getCell(col).value);
      if (field === "debit" || field === "credit" || field === "solde") {
        (partial as Record<string, unknown>)[field] = parseAmount(raw);
      } else if (field === "type") {
        partial.type = parseType(raw);
      } else {
        (partial as Record<string, unknown>)[field] = raw;
      }
    });

    if (!partial.reference && !partial.libelle && !(partial.debit || partial.credit)) return;

    rows.push({
      date: partial.date || new Date().toISOString().slice(0, 10),
      societeNom: partial.societeNom || "",
      type: partial.type || "all",
      reference: partial.reference || "",
      libelle: partial.libelle || "",
      debit: partial.debit || 0,
      credit: partial.credit || 0,
      statut: partial.statut || "",
      rowNumber,
    });
  });

  return rows;
}

export type ClasseurImportApplyPlan = {
  updates: Array<{
    sourceType: ClasseurType;
    sourceId: string;
    debit?: number;
    credit?: number;
    libelle?: string;
  }>;
  unmatched: ClasseurImportRow[];
};

/** Réconcilie les lignes importées avec le journal courant (par référence). */
export function planClasseurImport(
  imported: ClasseurImportRow[],
  current: Array<{ type: ClasseurType; sourceId: string; reference: string }>,
): ClasseurImportApplyPlan {
  const byRef = new Map(current.map((e) => [e.reference.toLowerCase(), e]));
  const updates: ClasseurImportApplyPlan["updates"] = [];
  const unmatched: ClasseurImportRow[] = [];

  for (const row of imported) {
    const match = byRef.get(row.reference.toLowerCase());
    if (!match) {
      unmatched.push(row);
      continue;
    }
    updates.push({
      sourceType: match.type,
      sourceId: match.sourceId,
      debit: row.debit,
      credit: row.credit,
      libelle: row.libelle || undefined,
    });
  }

  return { updates, unmatched };
}

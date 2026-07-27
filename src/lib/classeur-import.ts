/**
 * Import .xlsx → lignes classeur (ExcelJS côté client).
 * Colonnes attendues : Date, Société, Type, Référence, Libellé, Débit, Crédit, Statut
 */

import ExcelJS from "exceljs";
import type { ClasseurType } from "@/lib/classeur";

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

const HEADER_ALIASES: Record<string, keyof Omit<ClasseurImportRow, "rowNumber">> = {
  date: "date",
  société: "societeNom",
  societe: "societeNom",
  type: "type",
  référence: "reference",
  reference: "reference",
  libellé: "libelle",
  libelle: "libelle",
  débit: "debit",
  debit: "debit",
  crédit: "credit",
  credit: "credit",
  statut: "statut",
};

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function cellToString(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object" && "text" in v && typeof (v as { text: unknown }).text === "string") {
    return (v as { text: string }).text;
  }
  if (typeof v === "object" && "result" in v) {
    return cellToString((v as { result: ExcelJS.CellValue }).result);
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

export async function parseClasseurXlsx(file: ArrayBuffer): Promise<ClasseurImportRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(file);
  const sheet = wb.worksheets[0];
  if (!sheet) return [];

  const headerRow = sheet.getRow(1);
  const colMap = new Map<number, keyof Omit<ClasseurImportRow, "rowNumber">>();

  headerRow.eachCell((cell, colNumber) => {
    const key = HEADER_ALIASES[normalizeHeader(cellToString(cell.value))];
    if (key) colMap.set(colNumber, key);
  });

  if (colMap.size === 0) {
    throw new Error("En-têtes Excel non reconnus (attendu : Date, Type, Référence, Débit, Crédit…)");
  }

  const rows: ClasseurImportRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const partial: Partial<ClasseurImportRow> = { rowNumber };
    colMap.forEach((field, col) => {
      const raw = cellToString(row.getCell(col).value);
      if (field === "debit" || field === "credit") {
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

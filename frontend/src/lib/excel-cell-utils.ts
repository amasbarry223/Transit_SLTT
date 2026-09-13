/**
 * Petits utilitaires de lecture de cellule ExcelJS partages par les imports en
 * masse (dossier-bulk-import.ts, stock-bulk-import.ts) - etaient dupliques a
 * l'identique dans les deux fichiers avant extraction.
 */

import type ExcelJS from "exceljs";

/** Normalise un en-tete de colonne pour un matching insensible a la casse/accents/ponctuation. */
export function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Convertit une valeur de cellule ExcelJS (texte riche, formule, date) en chaine exploitable. */
export function cellToString(v: ExcelJS.CellValue): string {
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
  }
  return String(v);
}

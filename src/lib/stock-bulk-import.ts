/**
 * Import .xlsx multi-articles → mouvements de stock historiques (ExcelJS
 * côté client). Format maison : une feuille par article (« Cube Top Doumani »,
 * etc.), avec un tableau positionnel Dates | Désignation | Quantité | Entrée |
 * Sortie | Stocks — un grand livre papier tenu à la main, retranscrit dans
 * Excel. Miroir de dossier-bulk-import.ts, adapté à la forme stock (une
 * feuille = un article, pas un client).
 */

import type ExcelJS from "exceljs";
import { parseAmount } from "@/lib/format";
import { normalizeDate } from "@/lib/documents/ocr/mappers/dossier-mapper";
import { normalizeHeader, cellToString } from "@/lib/excel-cell-utils";

export interface StockBulkImportRow {
  rowNumber: number;
  /** ISO YYYY-MM-DD, ou "" si illisible. */
  date: string;
  dateRaw: string;
  /**
   * Date proposée d'après le voisinage chrono (typo année/mois, ou illisible).
   * La revue préremplit ce champ — l'utilisateur confirme avant import.
   */
  dateSuggested?: string;
  designation: string;
  type: "Entrée" | "Sortie" | null;
  quantite: number;
  /** Colonne "Stocks" déclarée dans le fichier (pour contrôle croisé), ou null si absente. */
  stockDeclare: number | null;
  /** Solde recalculé (précédent + entrée − sortie) dans l'ordre du fichier. */
  stockCalcule: number;
  warnings: string[];
}

export interface StockBulkImportGroup {
  sheetName: string;
  /** Nom d'article suggéré (nom de feuille, sauf générique) — toujours éditable en revue. */
  articleNomSuggere: string;
  rows: StockBulkImportRow[];
}

const GENERIC_SHEET_NAMES = new Set(["sheet1", "feuil1", "feuille1", "sheet", "feuille"]);

interface HeaderColumns {
  dateCol: number;
  designationCol: number;
  entreeCol: number;
  sortieCol: number;
  stocksCol: number | null;
}

/** Cherche la ligne d'en-tête « Dates | Désignation | … | Entrée | Sortie | Stocks » dans les ~20 premières lignes. */
function findHeaderColumns(sheet: ExcelJS.Worksheet): { rowNumber: number; cols: HeaderColumns } | null {
  const maxScan = Math.min(20, sheet.rowCount || 20);
  for (let r = 1; r <= maxScan; r++) {
    const row = sheet.getRow(r);
    const maxCol = Math.min(30, row.cellCount || 30);
    let dateCol: number | null = null;
    let designationCol: number | null = null;
    let entreeCol: number | null = null;
    let sortieCol: number | null = null;
    let stocksCol: number | null = null;
    for (let c = 1; c <= maxCol; c++) {
      const h = normalizeHeader(cellToString(row.getCell(c).value));
      if (dateCol == null && h === "dates") dateCol = c;
      if (designationCol == null && h.includes("designation")) designationCol = c;
      if (entreeCol == null && h === "entree") entreeCol = c;
      if (sortieCol == null && h === "sortie") sortieCol = c;
      if (stocksCol == null && h === "stocks") stocksCol = c;
    }
    if (dateCol != null && (entreeCol != null || sortieCol != null)) {
      return {
        rowNumber: r,
        cols: {
          dateCol,
          designationCol: designationCol ?? dateCol + 1,
          entreeCol: entreeCol ?? dateCol + 3,
          sortieCol: sortieCol ?? dateCol + 4,
          stocksCol,
        },
      };
    }
  }
  return null;
}

/** Nom d'article par défaut = nom de la feuille, sauf générique (Sheet1…) — jamais déduit d'un titre en ligne 1 (qui nomme la société, pas l'article). */
function resolveArticleNomSuggere(sheet: ExcelJS.Worksheet): string {
  const sheetName = sheet.name.trim();
  if (!sheetName || GENERIC_SHEET_NAMES.has(normalizeHeader(sheetName))) return "";
  return sheetName;
}

const DAY_MS = 86_400_000;
/** Lignes de part et d'autre pour estimer la date « attendue » (grand livre quasi séquentiel). */
const CHRONO_WINDOW = 10;
/** Écart au-delà duquel une date lue est probablement une typo année/mois, pas un vrai trou. */
const CHRONO_THRESHOLD_DAYS = 25;

function isValidYmd(y: number, m: number, d: number): boolean {
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false;
  if (y < 1990 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function toIso(y: number, m: number, d: number): string | null {
  if (!isValidYmd(y, m, d)) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseIsoParts(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

function formatIsoFr(iso: string): string {
  const { y, m, d } = parseIsoParts(iso);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

function isoDayNumber(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`) / DAY_MS;
}

function medianIso(dates: string[]): string | null {
  if (dates.length === 0) return null;
  const sorted = [...dates].sort();
  return sorted[Math.floor((sorted.length - 1) / 2)] ?? null;
}

function shiftMonth(y: number, m: number, delta: number): { y: number; m: number } {
  const idx = y * 12 + (m - 1) + delta;
  return { y: Math.floor(idx / 12), m: ((idx % 12) + 12) % 12 + 1 };
}

function extractDayFromRaw(raw: string): number | null {
  const match = raw.trim().match(/^(\d{1,2})\b/);
  if (!match) return null;
  const d = Number(match[1]);
  return d >= 1 && d <= 31 ? d : null;
}

function collectDateCandidates(day: number, original: string | null, median: string): string[] {
  const med = parseIsoParts(median);
  const seen = new Set<string>();
  const add = (iso: string | null) => {
    if (iso) seen.add(iso);
  };
  add(toIso(med.y, med.m, day));
  const plus = shiftMonth(med.y, med.m, 1);
  const minus = shiftMonth(med.y, med.m, -1);
  add(toIso(plus.y, plus.m, day));
  add(toIso(minus.y, minus.m, day));
  if (original) {
    const o = parseIsoParts(original);
    add(toIso(med.y, o.m, o.d));
    add(toIso(med.y + 1, o.m, o.d));
    add(toIso(med.y - 1, o.m, o.d));
  }
  return [...seen];
}

function closestToMedian(candidates: string[], median: string): string | null {
  if (candidates.length === 0) return null;
  const mDays = isoDayNumber(median);
  let best = candidates[0]!;
  let bestDist = Infinity;
  for (const candidate of candidates) {
    const dist = Math.abs(isoDayNumber(candidate) - mDays);
    if (dist < bestDist) {
      best = candidate;
      bestDist = dist;
    }
  }
  return best;
}

/**
 * Repère les dates lues qui cassent la séquence du grand livre (année/mois
 * incohérent avec les voisins) et propose une correction — même logique que
 * les 10 rustines de 20260907_seed_stock_top_doumani_historique.sql, sans
 * les appliquer en silence : la revue préremplit et l'utilisateur confirme.
 */
function applyChronologicalDateSuggestions(rows: StockBulkImportRow[]): void {
  if (rows.length < 3) return;

  for (let i = 0; i < rows.length; i++) {
    const neighborDates: string[] = [];
    const from = Math.max(0, i - CHRONO_WINDOW);
    const to = Math.min(rows.length - 1, i + CHRONO_WINDOW);
    for (let j = from; j <= to; j++) {
      if (j === i) continue;
      if (rows[j]!.date) neighborDates.push(rows[j]!.date);
    }
    const median = medianIso(neighborDates);
    if (!median) continue;

    const row = rows[i]!;
    const original = row.date || null;
    if (original && Math.abs(isoDayNumber(original) - isoDayNumber(median)) <= CHRONO_THRESHOLD_DAYS) {
      continue;
    }

    const day = original ? parseIsoParts(original).d : extractDayFromRaw(row.dateRaw);
    if (day == null) continue;

    const suggested = closestToMedian(collectDateCandidates(day, original, median), median);
    if (!suggested || suggested === original) continue;

    row.dateSuggested = suggested;
    if (original) {
      row.warnings.push(
        `Date hors séquence (« ${row.dateRaw} » lu ${formatIsoFr(original)}, voisins autour du ${formatIsoFr(median)}) — suggestion : ${formatIsoFr(suggested)}`,
      );
    } else {
      row.warnings.push(`Suggestion d'après les lignes voisines : ${formatIsoFr(suggested)}`);
    }
  }
}

function parseDataRow(
  row: ExcelJS.Row,
  cols: HeaderColumns,
  rowNumber: number,
  previousStockCalcule: number,
): StockBulkImportRow | null {
  const dateRaw = cellToString(row.getCell(cols.dateCol).value).trim();
  const designation = cellToString(row.getCell(cols.designationCol).value).trim();
  const entreeRaw = cellToString(row.getCell(cols.entreeCol).value).trim();
  const sortieRaw = cellToString(row.getCell(cols.sortieCol).value).trim();
  const stocksRaw = cols.stocksCol != null ? cellToString(row.getCell(cols.stocksCol).value).trim() : "";

  if (!dateRaw && !designation && !entreeRaw && !sortieRaw) return null;

  const entree = entreeRaw ? parseAmount(entreeRaw) : 0;
  const sortie = sortieRaw ? parseAmount(sortieRaw) : 0;
  const warnings: string[] = [];

  let type: "Entrée" | "Sortie" | null = null;
  let quantite = 0;
  if (entree > 0 && sortie > 0) {
    warnings.push("Entrée et Sortie renseignées sur la même ligne — ambigu");
  } else if (entree > 0) {
    type = "Entrée";
    quantite = entree;
  } else if (sortie > 0) {
    type = "Sortie";
    quantite = sortie;
  } else {
    warnings.push("Ni Entrée ni Sortie renseignée");
  }

  const date = dateRaw ? normalizeDate(dateRaw) : null;
  if (dateRaw && !date) warnings.push(`Date illisible : « ${dateRaw} »`);
  if (!dateRaw) warnings.push("Date manquante");

  const stockCalcule = previousStockCalcule + (type === "Entrée" ? quantite : type === "Sortie" ? -quantite : 0);
  const stockDeclare = stocksRaw ? parseAmount(stocksRaw) : null;
  if (stockDeclare != null && Math.abs(stockDeclare - stockCalcule) > 0) {
    warnings.push(
      `Stock déclaré (${stockDeclare.toLocaleString("fr-FR")}) ≠ calculé (${stockCalcule.toLocaleString("fr-FR")})`,
    );
  }

  return {
    rowNumber,
    date: date ?? "",
    dateRaw,
    designation,
    type,
    quantite,
    stockDeclare,
    stockCalcule,
    warnings,
  };
}

/** Parse un classeur (une feuille par article) en groupes de mouvements prêts à revue. */
export async function parseStockBulkXlsx(file: ArrayBuffer): Promise<StockBulkImportGroup[]> {
  const { default: ExcelJSLib } = await import("exceljs");
  const wb = new ExcelJSLib.Workbook();
  await wb.xlsx.load(file);

  const groups: StockBulkImportGroup[] = [];
  for (const sheet of wb.worksheets) {
    const header = findHeaderColumns(sheet);
    if (!header) continue;

    const rows: StockBulkImportRow[] = [];
    let runningStock = 0;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= header.rowNumber) return;
      const parsed = parseDataRow(row, header.cols, rowNumber, runningStock);
      if (parsed) {
        rows.push(parsed);
        runningStock = parsed.stockCalcule;
      }
    });

    if (rows.length > 0) {
      applyChronologicalDateSuggestions(rows);
      groups.push({ sheetName: sheet.name, articleNomSuggere: resolveArticleNomSuggere(sheet), rows });
    }
  }

  return groups;
}

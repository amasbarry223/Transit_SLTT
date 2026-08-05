/**
 * Import .xlsx multi-clients → lignes dossiers historiques (ExcelJS côté client).
 * Format maison : une feuille par client, titrée « Situation du Client <NOM> »,
 * avec un tableau positionnel Date | Nature de la M/se | Quantité | Facture N° |
 * Total investi | Montant payé | Reste à payer | Bénéfice net. Le fichier source
 * peut dupliquer ce bloc de 8 colonnes plusieurs fois sur la même ligne d'en-tête
 * (gabarit Excel avec colonnes de secours) — tous les blocs détectés sont lus.
 */

import ExcelJS from "exceljs";
import { parseAmount } from "@/lib/format";
import { normalizeDate } from "@/lib/documents/ocr/mappers/dossier-mapper";

export interface DossierBulkImportRow {
  clientNom: string;
  sheetName: string;
  rowNumber: number;
  /** ISO YYYY-MM-DD, ou "" si illisible. */
  date: string;
  dateRaw: string;
  nature: string;
  quantite: string;
  factureNo: string;
  montantInvesti: number;
  montantPaye: number;
  /** Reste à payer tel que déclaré dans le fichier (pour contrôle croisé). */
  resteAPayerFichier: number | null;
  /** Ligne « versement »/remboursement sans marchandise (investi nul, payé renseigné) — exclue par défaut, pas une anomalie. */
  isPaiementSeul: boolean;
  warnings: string[];
}

const CLIENT_TITLE_RE = /situation\s+du\s+client\s*[:\-]?\s*(.+)/i;
const GENERIC_SHEET_NAMES = new Set(["sheet1", "feuil1", "feuille1", "sheet", "feuille"]);

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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
  }
  return String(v);
}

/** Cherche « Situation du Client X » dans les premières lignes ; sinon replie sur le nom de la feuille. */
function resolveClientNom(sheet: ExcelJS.Worksheet): string | null {
  const maxScan = Math.min(8, sheet.rowCount || 8);
  for (let r = 1; r <= maxScan; r++) {
    const row = sheet.getRow(r);
    for (let c = 1; c <= Math.min(20, row.cellCount || 20); c++) {
      const text = cellToString(row.getCell(c).value);
      const match = CLIENT_TITLE_RE.exec(text);
      if (match?.[1]?.trim()) return match[1].trim();
    }
  }
  const sheetName = sheet.name.trim();
  if (!sheetName || GENERIC_SHEET_NAMES.has(normalizeHeader(sheetName))) return null;
  return sheetName;
}

/** Colonnes de départ de chaque bloc « Date | Nature | Quantité | Facture N° | Total investi | Montant payé | Reste à payer | Bénéfice net ». */
function findHeaderBlocks(row: ExcelJS.Row): number[] {
  const starts: number[] = [];
  const maxCol = Math.min(60, row.cellCount || 60);
  for (let c = 1; c <= maxCol; c++) {
    if (normalizeHeader(cellToString(row.getCell(c).value)) === "date") starts.push(c);
  }
  return starts;
}

function findHeaderRow(sheet: ExcelJS.Worksheet): number | null {
  const maxScan = Math.min(15, sheet.rowCount || 15);
  for (let r = 1; r <= maxScan; r++) {
    if (findHeaderBlocks(sheet.getRow(r)).length > 0) return r;
  }
  return null;
}

function parseBlockRow(
  row: ExcelJS.Row,
  startCol: number,
  clientNom: string,
  sheetName: string,
  rowNumber: number,
): DossierBulkImportRow | null {
  const dateRaw = cellToString(row.getCell(startCol).value).trim();
  const nature = cellToString(row.getCell(startCol + 1).value).trim();
  const quantite = cellToString(row.getCell(startCol + 2).value).trim();
  const factureNo = cellToString(row.getCell(startCol + 3).value).trim();
  const investiRaw = cellToString(row.getCell(startCol + 4).value).trim();
  const payeRaw = cellToString(row.getCell(startCol + 5).value).trim();
  const resteRaw = cellToString(row.getCell(startCol + 6).value).trim();

  const montantInvesti = parseAmount(investiRaw);
  const montantPaye = parseAmount(payeRaw);

  // Ligne vide (bloc de secours inutilisé, ou séparateur) : rien à importer.
  if (!dateRaw && !nature && montantInvesti === 0 && montantPaye === 0) return null;

  const date = dateRaw ? normalizeDate(dateRaw) : null;
  // Ligne « versement »/remboursement sans marchandise (souvent nature/date vides,
  // juste un montant payé) — normale dans ce classeur, pas une ligne dossier
  // incomplète : ne pas la signaler comme si elle manquait de données.
  const isPaiementSeul = montantInvesti === 0 && montantPaye > 0;

  const warnings: string[] = [];
  if (dateRaw && !date) warnings.push(`Date illisible : « ${dateRaw} »`);
  if (!isPaiementSeul) {
    if (!nature) warnings.push("Nature de la marchandise manquante");
    if (montantInvesti === 0) warnings.push("Total investi manquant ou nul");
  }

  const resteAPayerFichier = resteRaw ? parseAmount(resteRaw) : null;
  const resteCalcule = montantInvesti - montantPaye;
  if (
    resteAPayerFichier != null &&
    Math.abs(resteAPayerFichier - resteCalcule) > 1
  ) {
    warnings.push(
      `Reste à payer du fichier (${resteAPayerFichier.toLocaleString("fr-FR")}) ≠ calculé (${resteCalcule.toLocaleString("fr-FR")})`,
    );
  }

  return {
    clientNom,
    sheetName,
    rowNumber,
    date: date ?? "",
    dateRaw,
    nature,
    quantite,
    factureNo,
    montantInvesti,
    montantPaye,
    resteAPayerFichier,
    isPaiementSeul,
    warnings,
  };
}

/** Parse un classeur multi-clients (une feuille par client) en lignes dossier prêtes à revue. */
export async function parseDossierBulkXlsx(file: ArrayBuffer): Promise<DossierBulkImportRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(file);

  const rows: DossierBulkImportRow[] = [];
  for (const sheet of wb.worksheets) {
    const clientNom = resolveClientNom(sheet);
    if (!clientNom) continue;

    const headerRowNumber = findHeaderRow(sheet);
    if (headerRowNumber == null) continue;
    const blockStarts = findHeaderBlocks(sheet.getRow(headerRowNumber));

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowNumber) return;
      for (const startCol of blockStarts) {
        const parsed = parseBlockRow(row, startCol, clientNom, sheet.name, rowNumber);
        if (parsed) rows.push(parsed);
      }
    });
  }

  return rows;
}

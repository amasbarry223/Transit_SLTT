/**
 * Import .xlsx multi-clients → lignes dossiers historiques (ExcelJS côté client).
 * Format maison : une feuille par client, titrée « Situation du Client <NOM> »,
 * avec un tableau positionnel Date | Nature de la M/se | Quantité | Facture N° |
 * Total investi | Montant payé | Reste à payer | Bénéfice net. Le fichier source
 * peut dupliquer ce bloc de 8 colonnes plusieurs fois sur la même ligne d'en-tête
 * (gabarit Excel avec colonnes de secours) — tous les blocs détectés sont lus.
 */

import type ExcelJS from "exceljs";
import { parseAmount } from "@/lib/format";
import { normalizeDate } from "@/lib/documents/ocr/mappers/dossier-mapper";
import { normalizeHeader, cellToString } from "@/lib/excel-cell-utils";

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

/** Accepte les variantes réellement rencontrées : « du Client », « de la Cliente », casse libre. */
const CLIENT_TITLE_RE = /situation\s+d[eu](?:\s+la)?\s+client(?:e)?\s*[:\-]?\s*(.+)/i;
const GENERIC_SHEET_NAMES = new Set(["sheet1", "feuil1", "feuille1", "sheet", "feuille"]);

/**
 * Cherche « Situation du Client X » dans les premières lignes ; sinon replie
 * sur le nom de la feuille. Ne renvoie jamais null : un nom d'onglet encore
 * au défaut Excel ("Feuil1"…) ne doit jamais faire jeter une feuille dont le
 * tableau est par ailleurs lisible — seul le nom du client est incertain,
 * pas les données. Le placeholder reste unique par feuille (nécessaire pour
 * ne pas regrouper deux feuilles différentes sous la même "fausse" clé) et
 * reconnaissable pour être corrigé en revue avant import.
 */
function resolveClientNom(sheet: ExcelJS.Worksheet): string {
  // Certains classeurs ont un bandeau (logo, année, lignes vides) avant le titre.
  const maxScan = Math.min(20, sheet.rowCount || 20);
  for (let r = 1; r <= maxScan; r++) {
    const row = sheet.getRow(r);
    for (let c = 1; c <= Math.min(20, row.cellCount || 20); c++) {
      const text = cellToString(row.getCell(c).value);
      const match = CLIENT_TITLE_RE.exec(text);
      if (match?.[1]?.trim()) return match[1].trim();
    }
  }
  const sheetName = sheet.name.trim();
  if (sheetName && !GENERIC_SHEET_NAMES.has(normalizeHeader(sheetName))) return sheetName;
  return `Client à renommer (${sheetName || "feuille sans nom"})`;
}

/** Nom placeholder posé par resolveClientNom quand ni titre ni nom d'onglet ne sont exploitables. */
export function isPlaceholderClientNom(clientNom: string): boolean {
  return clientNom.startsWith("Client à renommer (");
}

/** Reconnaît « Date », mais aussi les en-têtes composés comme « Date opération »/« Date paiement » — jamais un simple `.includes` pour éviter qu'un mot contenant "date" par hasard ne matche. */
function isDateHeader(h: string): boolean {
  return h === "date" || h.startsWith("date ");
}

/** Colonnes de départ de chaque bloc « Date | Nature | Quantité | Facture N° | Total investi | Montant payé | Reste à payer | Bénéfice net ». */
function findHeaderBlocks(row: ExcelJS.Row): number[] {
  const starts: number[] = [];
  const maxCol = Math.min(60, row.cellCount || 60);
  for (let c = 1; c <= maxCol; c++) {
    if (isDateHeader(normalizeHeader(cellToString(row.getCell(c).value)))) starts.push(c);
  }
  return starts;
}

function findHeaderRow(sheet: ExcelJS.Worksheet): number | null {
  // Certains classeurs ont un bandeau (logo, titre société, année) avant l'en-tête réel.
  const maxScan = Math.min(40, sheet.rowCount || 40);
  for (let r = 1; r <= maxScan; r++) {
    if (findHeaderBlocks(sheet.getRow(r)).length > 0) return r;
  }
  return null;
}

interface BlockColumns {
  dateCol: number;
  natureCol: number;
  quantiteCol: number;
  factureCol: number;
  investiCol: number;
  payeCol: number;
  resteCol: number | null;
}

/**
 * Résout les colonnes d'un bloc par le libellé de leur en-tête plutôt que par position fixe :
 * l'ordre « Reste à payer » / « Bénéfice net » (et parfois l'absence de l'une des deux) varie
 * d'un client à l'autre dans ce classeur tenu à la main — une position figée après « Montant
 * payé » lit parfois le bénéfice à la place du reste. Nature/Quantité/Facture N°/Total investi/
 * Montant payé, eux, sont toujours dans cet ordre juste après Date sur tous les clients observés.
 */
function resolveBlockColumns(headerRow: ExcelJS.Row, startCol: number, endCol: number): BlockColumns {
  let investiCol: number | null = null;
  let payeCol: number | null = null;
  let resteCol: number | null = null;
  for (let c = startCol + 4; c <= endCol; c++) {
    const h = normalizeHeader(cellToString(headerRow.getCell(c).value));
    if (investiCol == null && h.includes("investi")) investiCol = c;
    if (payeCol == null && h.includes("paye")) payeCol = c;
    if (resteCol == null && h.includes("reste")) resteCol = c;
  }
  return {
    dateCol: startCol,
    natureCol: startCol + 1,
    quantiteCol: startCol + 2,
    factureCol: startCol + 3,
    investiCol: investiCol ?? startCol + 4,
    payeCol: payeCol ?? startCol + 5,
    resteCol,
  };
}

function parseBlockRow(
  row: ExcelJS.Row,
  cols: BlockColumns,
  clientNom: string,
  sheetName: string,
  rowNumber: number,
): DossierBulkImportRow | null {
  const dateRaw = cellToString(row.getCell(cols.dateCol).value).trim();
  const nature = cellToString(row.getCell(cols.natureCol).value).trim();
  const quantite = cellToString(row.getCell(cols.quantiteCol).value).trim();
  const factureNo = cellToString(row.getCell(cols.factureCol).value).trim();
  const investiRaw = cellToString(row.getCell(cols.investiCol).value).trim();
  const payeRaw = cellToString(row.getCell(cols.payeCol).value).trim();
  const resteRaw = cols.resteCol != null ? cellToString(row.getCell(cols.resteCol).value).trim() : "";

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

/**
 * Distingue un classeur « Journal de caisse » (Dates | Clients | Nature de la dépense |
 * Entrée | Sortie | Écart, cf. comptabilite-generale-import.ts) d'un classeur « Situation
 * des clients » — les deux sont des exports du même dossier comptable SLTT, seul le second
 * convient à cet import. Sert uniquement à orienter l'utilisateur quand aucune ligne n'a
 * été trouvée, jamais à décider quoi importer.
 */
export async function looksLikeJournalCaisseWorkbook(file: ArrayBuffer): Promise<boolean> {
  const { default: ExcelJSLib } = await import("exceljs");
  const wb = new ExcelJSLib.Workbook();
  await wb.xlsx.load(file);
  for (const sheet of wb.worksheets) {
    const maxScan = Math.min(20, sheet.rowCount || 20);
    for (let r = 1; r <= maxScan; r++) {
      const row = sheet.getRow(r);
      const headers = new Set<string>();
      for (let c = 1; c <= Math.min(20, row.cellCount || 20); c++) {
        headers.add(normalizeHeader(cellToString(row.getCell(c).value)));
      }
      if (headers.has("entree") && headers.has("sortie")) return true;
    }
  }
  return false;
}

export interface DossierBulkDiagnostic {
  sheetsScanned: number;
  sheetsWithHeaderRow: number;
}

/**
 * Utilisé uniquement quand parseDossierBulkXlsx ne trouve aucune ligne, pour
 * expliquer précisément pourquoi plutôt qu'un message générique : est-ce
 * qu'aucune feuille n'a d'en-tête Date reconnu (mauvais format de fichier),
 * ou est-ce que l'en-tête est là mais qu'il n'y a aucune ligne de données
 * dessous (tableau vide) ?
 */
export async function diagnoseDossierBulkWorkbook(file: ArrayBuffer): Promise<DossierBulkDiagnostic> {
  const { default: ExcelJSLib } = await import("exceljs");
  const wb = new ExcelJSLib.Workbook();
  await wb.xlsx.load(file);
  let sheetsWithHeaderRow = 0;
  for (const sheet of wb.worksheets) {
    if (findHeaderRow(sheet) != null) sheetsWithHeaderRow++;
  }
  return { sheetsScanned: wb.worksheets.length, sheetsWithHeaderRow };
}

/** Parse un classeur multi-clients (une feuille par client) en lignes dossier prêtes à revue. */
export async function parseDossierBulkXlsx(file: ArrayBuffer): Promise<DossierBulkImportRow[]> {
  const { default: ExcelJSLib } = await import("exceljs");
  const wb = new ExcelJSLib.Workbook();
  await wb.xlsx.load(file);

  const rows: DossierBulkImportRow[] = [];
  for (const sheet of wb.worksheets) {
    const clientNom = resolveClientNom(sheet);

    const headerRowNumber = findHeaderRow(sheet);
    if (headerRowNumber == null) continue;
    const headerRow = sheet.getRow(headerRowNumber);
    const blockStarts = findHeaderBlocks(headerRow);
    const blockColumns = blockStarts.map((start, i) => {
      const nextStart = blockStarts[i + 1];
      const endCol = nextStart ? nextStart - 1 : start + 8;
      return resolveBlockColumns(headerRow, start, endCol);
    });

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowNumber) return;
      for (const cols of blockColumns) {
        const parsed = parseBlockRow(row, cols, clientNom, sheet.name, rowNumber);
        if (parsed) rows.push(parsed);
      }
    });
  }

  return rows;
}

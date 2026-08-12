/**
 * Import .xlsx → lignes de comptabilité générale (ExcelJS côté client), sur
 * le modèle de src/lib/classeur-import.ts. Colonnes attendues (classeur
 * SLTT/STLL) : Dates, Clients, Nature de la dépense, Entrée, Sortie[, Écart]
 * — et pour Top Doumani en plus : Quantité, Prix unitaire.
 *
 * Ne calcule ni n'insère jamais rien seul : `parseComptabiliteGeneraleXlsx`
 * retourne des lignes + avertissements, à valider ligne par ligne dans
 * ComptabiliteGeneraleImportDialog avant tout appel à `addOperationComptable`.
 */
import ExcelJS from "exceljs";

export type OperationImportRow = {
  /** Index 1-based dans le fichier (pour messages d'erreur / tri). */
  rowNumber: number;
  date: string | null;
  dateRaw: string;
  clientNom: string;
  nature: string;
  type: "Entrée" | "Sortie" | null;
  montant: number;
  quantite: number | null;
  prixUnitaire: number | null;
  warnings: string[];
};

type Field =
  | "date"
  | "clientNom"
  | "nature"
  | "entree"
  | "sortie"
  | "ecart"
  | "quantite"
  | "prixUnitaire";

const HEADER_ALIASES: Record<string, Field> = {
  date: "date",
  dates: "date",
  "date operation": "date",
  client: "clientNom",
  clients: "clientNom",
  tiers: "clientNom",
  nature: "nature",
  "nature de la depense": "nature",
  "nature de la depenses": "nature",
  libelle: "nature",
  designation: "nature",
  entree: "entree",
  "entrees": "entree",
  sortie: "sortie",
  sorties: "sortie",
  ecart: "ecart",
  quantite: "quantite",
  qte: "quantite",
  "prix unitaire": "prixUnitaire",
  "prix unit": "prixUnitaire",
  pu: "prixUnitaire",
};

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function resolveHeaderField(raw: string): Field | null {
  const n = normalizeHeader(raw);
  if (!n) return null;
  if (HEADER_ALIASES[n]) return HEADER_ALIASES[n];
  for (const [alias, field] of Object.entries(HEADER_ALIASES)) {
    if (n === alias || n.startsWith(`${alias} `) || n.endsWith(` ${alias}`)) return field;
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
    if ("result" in v) return cellToString((v as { result: ExcelJS.CellValue }).result);
  }
  return String(v);
}

function parseAmount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(/[\s ]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Accepte un ISO déjà normalisé (cellule Date Excel) ou "JJ/MM/AAAA" /
 * "JJ-MM-AAAA". Rejette explicitement (retourne null) toute date dont
 * l'année n'a pas 4 chiffres plausibles ou dont le jour/mois est hors
 * plage — le fichier source contient de vraies coquilles ("31/03/265",
 * "21/04/2024" pour 2026) qui doivent être corrigées à la main, jamais
 * silencieusement acceptées ou recalées sur la date du jour.
 */
export function parseSourceDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return isPlausibleDate(Number(y), Number(m), Number(d)) ? `${y}-${m}-${d}` : null;
  }
  const frMatch = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (frMatch) {
    const [, dRaw, mRaw, yRaw] = frMatch;
    const day = Number(dRaw);
    const month = Number(mRaw);
    let year = Number(yRaw);
    if (yRaw.length === 2) year += 2000;
    if (yRaw.length === 3) return null; // coquille type "265" — jamais recalée automatiquement
    if (!isPlausibleDate(year, month, day)) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return null;
}

function isPlausibleDate(year: number, month: number, day: number): boolean {
  if (year < 2000 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

function buildColMap(row: ExcelJS.Row): Map<number, Field> {
  const colMap = new Map<number, Field>();
  row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const field = resolveHeaderField(cellToString(cell.value));
    if (field) colMap.set(colNumber, field);
  });
  return colMap;
}

function findHeaderRow(sheet: ExcelJS.Worksheet): { headerRowNumber: number; colMap: Map<number, Field> } {
  const maxScan = Math.max(10, Math.min(20, sheet.rowCount || 10));
  for (let r = 1; r <= maxScan; r++) {
    const colMap = buildColMap(sheet.getRow(r));
    // Au moins Date + (Client ou Nature) + (Entrée ou Sortie)
    const hasDate = [...colMap.values()].includes("date");
    if (colMap.size >= 3 && hasDate) return { headerRowNumber: r, colMap };
  }
  return { headerRowNumber: 1, colMap: new Map() };
}

export interface ParseComptabiliteGeneraleOptions {
  /** Top Doumani : les colonnes Quantité/Prix unitaire sont attendues et priment sur une Sortie déjà chiffrée. */
  entiteType: "annexe" | "societe";
}

export async function parseComptabiliteGeneraleXlsx(
  file: ArrayBuffer,
  options: ParseComptabiliteGeneraleOptions,
): Promise<OperationImportRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(file);
  if (!wb.worksheets.length) return [];

  const sheet = wb.worksheets[0];
  const { headerRowNumber, colMap } = findHeaderRow(sheet);
  if (colMap.size < 3) {
    throw new Error(
      "En-têtes Excel non reconnus (attendu : Dates, Clients, Nature de la dépense, Entrée, Sortie…)",
    );
  }

  const rows: OperationImportRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowNumber) return;

    const raw: Partial<Record<Field, string>> = {};
    colMap.forEach((field, col) => {
      raw[field] = cellToString(row.getCell(col).value);
    });

    const dateRaw = raw.date ?? "";
    const clientNom = (raw.clientNom ?? "").trim();
    const nature = (raw.nature ?? "").trim();
    const entree = raw.entree ? parseAmount(raw.entree) : null;
    const sortie = raw.sortie ? parseAmount(raw.sortie) : null;
    const quantite = raw.quantite ? parseAmount(raw.quantite) : null;
    const prixUnitaire = raw.prixUnitaire ? parseAmount(raw.prixUnitaire) : null;

    // Ligne totalement vide (espaceur entre mois dans le classeur source) — ignorée sans avertissement.
    if (!clientNom && !nature && !entree && !sortie && !quantite && !prixUnitaire) return;

    const warnings: string[] = [];
    const date = dateRaw ? parseSourceDate(dateRaw) : null;
    if (!dateRaw) warnings.push("Date manquante");
    else if (!date) warnings.push(`Date illisible ("${dateRaw}") — vérifiez le jour/mois/année`);

    if (!clientNom) warnings.push("Client / tiers manquant");
    if (!nature) warnings.push("Nature manquante");

    let type: "Entrée" | "Sortie" | null = null;
    let montant = 0;

    const montantTopDoumani =
      options.entiteType === "societe" && quantite != null && prixUnitaire != null
        ? quantite * prixUnitaire
        : null;

    if (montantTopDoumani != null) {
      type = "Sortie";
      montant = montantTopDoumani;
    } else if (entree != null && sortie != null) {
      warnings.push("Entrée ET Sortie renseignées sur la même ligne — vérifiez laquelle est correcte");
      type = entree >= sortie ? "Entrée" : "Sortie";
      montant = entree >= sortie ? entree : sortie;
    } else if (entree != null) {
      type = "Entrée";
      montant = entree;
    } else if (sortie != null) {
      type = "Sortie";
      montant = sortie;
    } else if (options.entiteType === "societe" && (quantite != null) !== (prixUnitaire != null)) {
      warnings.push("Quantité et Prix unitaire doivent être renseignés ensemble");
    } else {
      warnings.push("Montant manquant (Entrée / Sortie / Quantité × PU)");
    }

    rows.push({
      rowNumber,
      date,
      dateRaw,
      clientNom,
      nature,
      type,
      montant,
      quantite: options.entiteType === "societe" ? quantite : null,
      prixUnitaire: options.entiteType === "societe" ? prixUnitaire : null,
      warnings,
    });
  });

  return rows;
}

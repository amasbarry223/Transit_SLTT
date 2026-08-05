/**
 * Pont GrandLivre ↔ journal SLTT (ClasseurEntry).
 * Injection et lecture via l'API Facade Univer (FWorksheet / FRange).
 */

import type { ClasseurEntry, ClasseurType } from "@/lib/classeur";
import { GRAND_LIVRE_HEADERS, GRAND_LIVRE_SHEET_NAME } from "@/lib/excel/template";

/** Capacité max souhaitée (nouveaux classeurs). */
export const GRAND_LIVRE_MAX_ROWS = 2000;
/** Fallback pour anciens snapshots (template v1 = 200 lignes). */
export const GRAND_LIVRE_DEFAULT_ROWS = 200;

/** Interface minimale du facade Univer pour éviter un couplage fort aux types. */
export type UniverApiLike = {
  getActiveWorkbook: () => {
    getSheetByName: (name: string) => {
      getRange: (a1: string) => {
        setValues: (values: (string | number | null)[][]) => unknown;
        getValues: () => (string | number | boolean | null | undefined)[][];
        setValue: (v: string | number) => unknown;
        setFontWeight: (w: "bold" | "normal") => unknown;
        setBackgroundColor?: (c: string) => unknown;
        setFontColor?: (c: string) => unknown;
      };
      getMaxRows?: () => number;
      getRowCount?: () => number;
    } | null;
    save: () => Record<string, unknown>;
  } | null;
};

export type GrandLivreRow = {
  /** Numéro de ligne feuille Excel (1 = en-tête). */
  sheetRow: number;
  date: string;
  societeNom: string;
  type: string;
  reference: string;
  libelle: string;
  debit: number;
  credit: number;
  statut: string;
  solde: number;
};

function cellToString(v: unknown): string {
  if (v == null || v === false) return "";
  if (typeof v === "object" && v !== null && "v" in (v as object)) {
    return String((v as { v: unknown }).v ?? "");
  }
  return String(v);
}

function cellToNumber(v: unknown): number {
  const s = cellToString(v).replace(/\s/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

/** Nombre de lignes réellement allouées à la feuille (évite "Range is out of bounds"). */
export function resolveGrandLivreRowCount(univerAPI: UniverApiLike): number {
  const wb = univerAPI.getActiveWorkbook();
  const sheet = wb?.getSheetByName(GRAND_LIVRE_SHEET_NAME);
  if (!sheet) return GRAND_LIVRE_DEFAULT_ROWS;

  try {
    const fromApi = sheet.getMaxRows?.() ?? sheet.getRowCount?.();
    if (typeof fromApi === "number" && fromApi > 0) {
      return Math.min(fromApi, GRAND_LIVRE_MAX_ROWS);
    }
  } catch {
    // ignore
  }

  try {
    const snap = wb?.save() as {
      sheets?: Record<string, { name?: string; id?: string; rowCount?: number }>;
    } | null;
    if (snap?.sheets) {
      for (const s of Object.values(snap.sheets)) {
        if (s.name === GRAND_LIVRE_SHEET_NAME || s.id === "sheet-grandlivre") {
          const n = Number(s.rowCount);
          if (Number.isFinite(n) && n > 0) return Math.min(n, GRAND_LIVRE_MAX_ROWS);
        }
      }
    }
  } catch {
    // ignore
  }

  return GRAND_LIVRE_DEFAULT_ROWS;
}

/** Remplit la feuille GrandLivre à partir du journal SLTT. */
export function injectGrandLivre(
  univerAPI: UniverApiLike,
  entries: ClasseurEntry[],
): void {
  const wb = univerAPI.getActiveWorkbook();
  if (!wb) throw new Error("Aucun classeur Excel actif");
  const sheet = wb.getSheetByName(GRAND_LIVRE_SHEET_NAME);
  if (!sheet) throw new Error(`Feuille « ${GRAND_LIVRE_SHEET_NAME} » introuvable`);

  const sheetRows = resolveGrandLivreRowCount(univerAPI);
  const clipped = entries.slice(0, Math.max(0, sheetRows - 1));

  const header = [...GRAND_LIVRE_HEADERS] as unknown as (string | number | null)[];
  const rows: (string | number | null)[][] = [header];

  for (const e of clipped) {
    rows.push([
      e.date,
      e.societeNom,
      e.type,
      e.reference,
      e.libelle,
      e.debit,
      e.credit,
      e.statut,
      e.soldeCumule,
    ]);
  }

  // Clear uniquement dans les bornes de la feuille (pas au-delà de rowCount).
  const empty = Array.from({ length: sheetRows }, () =>
    Array.from({ length: GRAND_LIVRE_HEADERS.length }, () => null as string | number | null),
  );
  sheet.getRange(`A1:I${sheetRows}`).setValues(empty);
  sheet.getRange(`A1:I${rows.length}`).setValues(rows);

  const headerRange = sheet.getRange("A1:I1");
  try {
    headerRange.setFontWeight("bold");
    headerRange.setBackgroundColor?.("#404089");
    headerRange.setFontColor?.("#FFFFFF");
  } catch {
    // Styles optionnels selon version facade
  }
}

/** Lit les lignes données de GrandLivre (hors en-tête). */
export function readGrandLivre(univerAPI: UniverApiLike): GrandLivreRow[] {
  const wb = univerAPI.getActiveWorkbook();
  if (!wb) throw new Error("Aucun classeur Excel actif");
  const sheet = wb.getSheetByName(GRAND_LIVRE_SHEET_NAME);
  if (!sheet) throw new Error(`Feuille « ${GRAND_LIVRE_SHEET_NAME} » introuvable`);

  const sheetRows = resolveGrandLivreRowCount(univerAPI);
  const values = sheet.getRange(`A1:I${sheetRows}`).getValues();
  if (!values?.length) return [];

  const rows: GrandLivreRow[] = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i] || [];
    const reference = cellToString(row[3]).trim();
    const libelle = cellToString(row[4]).trim();
    const debit = cellToNumber(row[5]);
    const credit = cellToNumber(row[6]);
    if (!reference && !libelle && debit === 0 && credit === 0) continue;

    rows.push({
      sheetRow: i + 1,
      date: cellToString(row[0]),
      societeNom: cellToString(row[1]),
      type: cellToString(row[2]),
      reference,
      libelle,
      debit,
      credit,
      statut: cellToString(row[7]),
      solde: cellToNumber(row[8]),
    });
  }
  return rows;
}

/** Réécrit la référence canonique après création d'une écriture (anti-doublon Apply). */
export function setGrandLivreReference(
  univerAPI: UniverApiLike,
  sheetRow: number,
  reference: string,
): void {
  const wb = univerAPI.getActiveWorkbook();
  const sheet = wb?.getSheetByName(GRAND_LIVRE_SHEET_NAME);
  if (!sheet) return;
  sheet.getRange(`D${sheetRow}`).setValue(reference);
}

export function parseClasseurType(raw: string): ClasseurType | null {
  const t = raw.trim().toLowerCase();
  if (t === "dossier") return "Dossier";
  if (t === "paiement" || t === "écriture" || t === "ecriture") return "Paiement";
  if (t === "facture") return "Facture";
  return null;
}

/** Référence canonique d'une écriture SLTT. */
export function ecritureClasseurReference(ecritureId: string): string {
  return `ÉCR-${ecritureId.slice(0, 8).toUpperCase()}`;
}

/** Clé de matching robuste (casse + accents) — évite ECR vs ÉCR. */
export function normalizeClasseurRef(reference: string): string {
  return reference
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

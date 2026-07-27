/**
 * Pont GrandLivre ↔ journal SLTT (ClasseurEntry).
 * Injection et lecture via l'API Facade Univer (FWorksheet / FRange).
 */

import type { ClasseurEntry, ClasseurType } from "@/lib/classeur";
import { GRAND_LIVRE_HEADERS, GRAND_LIVRE_SHEET_NAME } from "@/lib/excel/template";

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
    } | null;
    save: () => Record<string, unknown>;
  } | null;
};

export type GrandLivreRow = {
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

/** Remplit la feuille GrandLivre à partir du journal SLTT. */
export function injectGrandLivre(
  univerAPI: UniverApiLike,
  entries: ClasseurEntry[],
): void {
  const wb = univerAPI.getActiveWorkbook();
  if (!wb) throw new Error("Aucun classeur Excel actif");
  const sheet = wb.getSheetByName(GRAND_LIVRE_SHEET_NAME);
  if (!sheet) throw new Error(`Feuille « ${GRAND_LIVRE_SHEET_NAME} » introuvable`);

  const header = [...GRAND_LIVRE_HEADERS] as unknown as (string | number | null)[];
  const rows: (string | number | null)[][] = [header];

  for (const e of entries) {
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

  // Efface une zone large puis écrit les nouvelles valeurs
  const clearRows = Math.max(rows.length + 5, 50);
  const empty = Array.from({ length: clearRows }, () =>
    Array.from({ length: GRAND_LIVRE_HEADERS.length }, () => null as string | number | null),
  );
  sheet.getRange(`A1:I${clearRows}`).setValues(empty);
  sheet.getRange(`A1:I${rows.length}`).setValues(rows);

  // Style en-tête
  const headerRange = sheet.getRange("A1:I1");
  try {
    headerRange.setFontWeight("bold");
    headerRange.setBackgroundColor?.("#1E40AF");
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

  const maxRows = 500;
  const values = sheet.getRange(`A1:I${maxRows}`).getValues();
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

export function parseClasseurType(raw: string): ClasseurType | null {
  const t = raw.trim().toLowerCase();
  if (t === "dossier") return "Dossier";
  if (t === "paiement" || t === "écriture" || t === "ecriture") return "Paiement";
  if (t === "facture") return "Facture";
  return null;
}

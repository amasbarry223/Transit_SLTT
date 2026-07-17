/**
 * F5 — Comptabilité orientée Bénéfice, par société.
 * Fonctions pures (testables sans React/Zustand) pour filtrer par société +
 * période et calculer le bénéfice = recettes - dépenses.
 */
import { parseLocalDate } from "@/lib/format";

/**
 * Filtre une liste par société et par mois/année.
 * - societeId === null → aucun filtre société (tout inclus, y compris les
 *   lignes non affectées / nullable).
 * - societeId précis → exclut à la fois l'autre société ET les lignes non
 *   affectées (societeId undefined/null sur la ligne).
 */
export function filterBySocieteAndPeriode<T extends { societeId?: string | null; date: string }>(
  rows: T[],
  societeId: string | null,
  year: number,
  month: number, // 0-11
): T[] {
  return rows.filter((row) => {
    if (societeId !== null && row.societeId !== societeId) return false;
    const d = parseLocalDate(row.date);
    if (Number.isNaN(d.getTime())) return false;
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

/** Bénéfice = Recettes − Dépenses. */
export function computeBenefice(recettes: number, depenses: number): number {
  return recettes - depenses;
}

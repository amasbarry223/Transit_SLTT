/**
 * F5 — Comptabilité orientée Bénéfice.
 * Fonctions pures (testables sans React/Zustand) pour filtrer par
 * période / annexe et calculer le bénéfice = recettes - dépenses.
 */
import { parseLocalDate } from "@/lib/format";

/** Filtre une liste par mois/année. */
export function filterByPeriode<T extends { date: string }>(
  rows: T[],
  year: number,
  month: number, // 0-11
): T[] {
  return rows.filter((row) => {
    const d = parseLocalDate(row.date);
    if (Number.isNaN(d.getTime())) return false;
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

/**
 * Filtre une liste par annexe et par mois/année.
 * annexeId est toujours renseigné en base (NOT NULL) : pas de cas "non
 * affecté" à gérer ici.
 */
export function filterByAnnexeAndPeriode<T extends { annexeId: string; date: string }>(
  rows: T[],
  annexeId: string | null,
  year: number,
  month: number, // 0-11
): T[] {
  return rows.filter((row) => {
    if (annexeId !== null && row.annexeId !== annexeId) return false;
    const d = parseLocalDate(row.date);
    if (Number.isNaN(d.getTime())) return false;
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

/** Bénéfice = Recettes − Dépenses. */
export function computeBenefice(recettes: number, depenses: number): number {
  return recettes - depenses;
}

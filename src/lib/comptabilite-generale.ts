/**
 * Journal de caisse — helpers purs partagés entre l'onglet journal, l'import
 * Excel/OCR et les tests. Entités comptables par annexe (F-ANNEXE Mali/CI,
 * cf. domain-types.ts) — app mono-société (SLTT) : plus de 2e axe "société"
 * depuis le retrait de Top Doumani, cf. migration
 * 20260913_remove_societe_top_doumani.sql. Le type EntiteComptableType garde
 * la variante "societe" pour une éventuelle 2e société future, mais
 * resolveEntitesComptables n'en construit plus aucune aujourd'hui.
 */
import type { Annexe, EntiteComptable, OperationComptable } from "@/lib/domain-types";

/** Clé stable d'une entité comptable — sert de valeur d'onglet/sélecteur. */
export function entiteKeyOf(entite: { type: string; id: string }): string {
  return `${entite.type}:${entite.id}`;
}

/** Construit les entités comptables à partir des annexes déjà chargées (Mali/CI). */
export function resolveEntitesComptables(annexes: Annexe[]): EntiteComptable[] {
  return [...annexes]
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
    .map((a) => ({ type: "annexe", id: a.id, label: `Annexe ${a.nom}` }));
}

export function operationMatchesEntite(operation: OperationComptable, entite: EntiteComptable): boolean {
  if (operation.entiteType !== entite.type) return false;
  return operation.annexeId === entite.id;
}

export function filterOperationsByEntite(
  operations: OperationComptable[],
  entite: EntiteComptable,
): OperationComptable[] {
  return operations.filter((o) => operationMatchesEntite(o, entite));
}

export function filterOperationsByPeriode(
  operations: OperationComptable[],
  dateFrom?: string,
  dateTo?: string,
): OperationComptable[] {
  return operations.filter((o) => {
    if (dateFrom && o.date < dateFrom) return false;
    if (dateTo && o.date > dateTo) return false;
    return true;
  });
}

export interface OperationsTotals {
  totalEntree: number;
  totalSortie: number;
  soldeTheorique: number;
}

/** Solde théorique = cumul (Entrée - Sortie) — c'est ce que la clôture périodique compare au solde constaté. */
export function computeOperationsTotals(operations: OperationComptable[]): OperationsTotals {
  const totalEntree = operations.filter((o) => o.type === "Entrée").reduce((s, o) => s + o.montant, 0);
  const totalSortie = operations.filter((o) => o.type === "Sortie").reduce((s, o) => s + o.montant, 0);
  return { totalEntree, totalSortie, soldeTheorique: totalEntree - totalSortie };
}

export interface OperationWithEcartCumule {
  operation: OperationComptable;
  /** Solde cumulé (Entrée − Sortie) de l'entité juste après cette opération. */
  ecartCumule: number;
  /** Solde cumulé spécifique du client/tiers (Entrée − Sortie) juste après cette opération. */
  ecartClientCumule: number;
}

/** Extrait le numéro de séquence d'une référence "OPC-{n}" — ordre de saisie, pas la date. */
function referenceSeq(reference: string): number {
  const m = reference.match(/(\d+)\s*$/);
  return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
}

/**
  * Écart cumulé, ligne par ligne — calcule à la fois l'écart global d'entité et l'écart spécifique par client/tiers.
  */
export function computeRunningEcart(operations: OperationComptable[]): OperationWithEcartCumule[] {
  const sorted = [...operations].sort((a, b) => referenceSeq(a.reference) - referenceSeq(b.reference));
  let runningGlobal = 0;
  const runningByClient: Record<string, number> = {};

  return sorted.map((operation) => {
    const delta = operation.type === "Entrée" ? operation.montant : -operation.montant;
    runningGlobal += delta;

    const clientKey = (operation.clientId || operation.clientNom || "inconnu").trim().toLowerCase();
    runningByClient[clientKey] = (runningByClient[clientKey] || 0) + delta;

    return {
      operation,
      ecartCumule: runningGlobal,
      ecartClientCumule: runningByClient[clientKey],
    };
  });
}

export type OperationScopeFilter = "tous" | "dossiers" | "generales";

export function filterOperationsByScope(
  operations: OperationComptable[],
  scope: OperationScopeFilter,
): OperationComptable[] {
  if (scope === "dossiers") return operations.filter((o) => !!o.dossierId);
  if (scope === "generales") return operations.filter((o) => !o.dossierId);
  return operations;
}

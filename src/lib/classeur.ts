/**
 * Classeur client (retour client V1, section 3) — journal chronologique
 * unifié de tous les mouvements d'un client, toutes activités confondues
 * (dossiers de transit SLTT, écritures/bons de paiement, factures).
 *
 * Vue calculée en lecture seule : construite à partir du store, non
 * persistée telle quelle. Les montants se modifient depuis leur source.
 */
import type { AuditSourceType } from "@/lib/audit";
import type { Dossier, Ecriture, Facture } from "@/lib/domain-types";
import { dossiersNonFactures } from "@/lib/client-stats";

export type ClasseurType = "Dossier" | "Paiement" | "Facture";

export type MouvementSourceType = AuditSourceType;

export interface ClasseurEntry {
  id: string;
  sourceId: string;
  date: string;
  type: ClasseurType;
  reference: string;
  libelle: string;
  debit: number;
  credit: number;
  statut: string;
  soldeCumule: number;
}

function buildDossierLibelle(d: Dossier): string {
  const bl = d.bl?.trim();
  return `Dossier transit — ${d.nature}${bl ? ` · BL ${bl}` : ""}`;
}

/** Construit le journal complet (non filtré), trié chronologiquement, avec solde cumulé réel. */
export function buildClasseurJournal(
  clientId: string,
  dossiers: Dossier[],
  ecritures: Ecriture[],
  factures: Facture[],
): ClasseurEntry[] {
  const unsorted: Omit<ClasseurEntry, "soldeCumule">[] = [];

  // Un dossier déjà facturé cède sa ligne à sa facture (ci-dessous) : une
  // fois qu'une facture est générée à partir d'un dossier, c'est elle qui
  // porte le montant réel dû/encaissé (elle peut inclure la TVA, avoir son
  // propre historique de paiement via enregistrerPaiement). Avant ce
  // correctif, le classeur affichait TOUJOURS le dossier (montants figés au
  // moment de la facturation) ET excluait sa facture — la TVA facturée et
  // tout paiement encaissé sur la facture après coup restaient invisibles
  // dans le grand-livre client.
  for (const d of dossiersNonFactures(dossiers, factures)) {
    if (d.clientId !== clientId) continue;
    unsorted.push({
      id: `dossier-${d.id}`,
      sourceId: d.id,
      date: d.date,
      type: "Dossier",
      reference: d.reference,
      libelle: buildDossierLibelle(d),
      debit: d.montantInvesti,
      credit: d.montantPaye,
      statut: d.statut,
    });
  }

  for (const e of ecritures) {
    if (e.clientId !== clientId || e.dossierId) continue;
    unsorted.push({
      id: `ecriture-${e.id}`,
      sourceId: e.id,
      date: e.date,
      type: "Paiement",
      reference: `ÉCR-${e.id.slice(0, 8).toUpperCase()}`,
      libelle: e.note?.trim() || "Bon de paiement",
      debit: e.montantInvesti,
      credit: e.montantPaye,
      statut: e.montantPaye >= e.montantInvesti ? "Soldé" : "En attente",
    });
  }

  for (const f of factures) {
    if (f.clientId !== clientId) continue;
    const annulee = f.statut === "Annulée";
    unsorted.push({
      id: `facture-${f.id}`,
      sourceId: f.id,
      date: f.date,
      type: "Facture",
      reference: f.numero,
      libelle: f.lignes[0]?.description || "Facture",
      debit: annulee ? 0 : f.montantTTC,
      credit: annulee ? 0 : f.montantPaye,
      statut: f.statut,
    });
  }

  unsorted.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  let running = 0;
  return unsorted.map((entry) => {
    running += entry.debit - entry.credit;
    return { ...entry, soldeCumule: running };
  });
}

export interface ClasseurFilters {
  type: "all" | ClasseurType;
  dateFrom?: string;
  dateTo?: string;
}

export function hasClasseurPeriodFilter(filters: ClasseurFilters): boolean {
  return Boolean(filters.dateFrom || filters.dateTo);
}

export function filterClasseurJournal(
  entries: ClasseurEntry[],
  filters: ClasseurFilters,
): ClasseurEntry[] {
  return entries.filter((e) => {
    if (filters.type !== "all" && e.type !== filters.type) return false;
    if (filters.dateFrom && e.date < filters.dateFrom) return false;
    if (filters.dateTo && e.date > filters.dateTo) return false;
    return true;
  });
}

export interface ClasseurTotals {
  totalDebit: number;
  totalCredit: number;
  soldeNet: number;
}

export function computeClasseurTotals(filteredEntries: ClasseurEntry[]): ClasseurTotals {
  const totalDebit = filteredEntries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = filteredEntries.reduce((s, e) => s + e.credit, 0);
  return { totalDebit, totalCredit, soldeNet: totalDebit - totalCredit };
}

export function classeurEntrySourceType(entry: ClasseurEntry): MouvementSourceType {
  if (entry.type === "Dossier") return "dossier";
  if (entry.type === "Paiement") return "ecriture";
  return "facture";
}

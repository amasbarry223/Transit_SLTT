/**
 * Classeur client (retour client V1, section 3) — journal chronologique
 * unifié de tous les mouvements d'un client, toutes activités confondues
 * (dossiers de transit SLTT, écritures/bons de paiement, factures).
 *
 * Vue calculée en lecture seule : construite à partir du store, non
 * persistée telle quelle. Les montants se modifient depuis leur source.
 */
import type { AuditSourceType } from "@/lib/audit";
import type { Dossier, Facture } from "@/lib/domain-types";

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
  factures: Facture[],
): ClasseurEntry[] {
  const unsorted: Omit<ClasseurEntry, "soldeCumule">[] = [];

  // Le dossier fait foi (client-stats.ts) : il porte le dû (total contrat) et
  // les règlements, qu'il soit facturé ou non. Chaque règlement est une ligne
  // « Paiement » à SA date (grand-livre : le solde cumulé suit les versements).
  // Ses factures apparaissent pour mémoire, sans débit ni crédit.
  for (const d of dossiers) {
    if (d.clientId !== clientId) continue;
    const detail = d.paiements && d.paiements.length > 0;
    unsorted.push({
      id: `dossier-${d.id}`,
      sourceId: d.id,
      date: d.date,
      type: "Dossier",
      reference: d.reference,
      libelle: buildDossierLibelle(d),
      // Ce que le client doit sur le dossier = total contrat.
      debit: d.totalContrat,
      // Détail des règlements non chargé : cumul porté par la ligne du dossier.
      credit: detail ? 0 : d.montantPaye,
      statut: d.statut,
    });
    if (!detail) continue;
    d.paiements!.forEach((p, i) => {
      unsorted.push({
        id: `paiement-${d.id}-${p.id ?? i}`,
        sourceId: d.id,
        date: p.date,
        type: "Paiement",
        reference: p.reference || d.reference,
        libelle: `Règlement — dossier ${d.reference}`,
        debit: 0,
        credit: p.montant,
        statut: "Encaissé",
      });
    });
  }

  for (const f of factures) {
    if (f.clientId !== clientId) continue;
    // Facture liée : portée par son dossier. Annulée/brouillon : sans effet.
    const comptee = !f.dossierId && f.statut !== "Annulée" && f.statut !== "Brouillon";
    const libelle = f.lignes[0]?.description || "Facture";
    unsorted.push({
      id: `facture-${f.id}`,
      sourceId: f.id,
      date: f.date,
      type: "Facture",
      reference: f.numero,
      libelle: f.dossierId ? `${libelle} (comptée sur son dossier)` : libelle,
      debit: comptee ? f.montantTTC : 0,
      credit: comptee ? f.montantPaye : 0,
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
  // Un règlement appartient à son dossier (sourceId = id du dossier).
  if (entry.type === "Paiement") return "dossier";
  return "facture";
}

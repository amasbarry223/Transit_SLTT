/**
 * Classeur client (retour client V1, section 3) — journal chronologique
 * unifié de tous les mouvements d'un client, toutes activités confondues
 * (dossiers de transit SLTT, écritures/bons de paiement, factures).
 */
import type { AuditEntry } from "@/lib/audit";
import { mapAuditLogFromDb, type AuditSourceType } from "@/lib/audit";
import type { Dossier, Ecriture, Facture, Societe } from "@/lib/domain-types";
import { supabase } from "@/lib/supabase";
import {
  LEGACY_TRANSIT_SOCIETE_ID,
  resolveSlttBrand,
  resolveSocieteDisplayNameById,
  resolveTransitSociete,
  SLTT_SOCIETE_ID,
} from "@/lib/societe-brand";

export {
  LEGACY_TRANSIT_SOCIETE_ID,
  resolveSlttBrand,
  resolveTransitSociete,
  SLTT_SOCIETE_ID,
};

export type ClasseurType = "Dossier" | "Paiement" | "Facture";

export type MouvementSourceType = AuditSourceType;

export interface ClasseurEntry {
  id: string;
  sourceId: string;
  date: string;
  societeId: string;
  societeNom: string;
  type: ClasseurType;
  reference: string;
  libelle: string;
  debit: number;
  credit: number;
  statut: string;
  soldeCumule: number;
}

function transitSocieteId(societes: Societe[]): string {
  return resolveTransitSociete(societes)?.id ?? LEGACY_TRANSIT_SOCIETE_ID;
}

function buildDossierLibelle(d: Dossier): string {
  const bl = d.bl?.trim();
  return `Dossier transit — ${d.nature}${bl ? ` · BL ${bl}` : ""}`;
}

function resolveEntrySocieteNom(
  societes: Societe[],
  societeId: string | undefined,
  fallback: string,
): string {
  if (!societeId) return fallback;
  return resolveSocieteDisplayNameById(societes, societeId, fallback);
}

/** Construit le journal complet (non filtré), trié chronologiquement, avec solde cumulé réel. */
export function buildClasseurJournal(
  clientId: string,
  dossiers: Dossier[],
  ecritures: Ecriture[],
  factures: Facture[],
  societes: Societe[],
): ClasseurEntry[] {
  const slttId = transitSocieteId(societes);
  const slttNom = resolveSocieteDisplayNameById(societes, slttId, "SLTT");
  const unsorted: Omit<ClasseurEntry, "soldeCumule">[] = [];

  for (const d of dossiers) {
    if (d.clientId !== clientId) continue;
    unsorted.push({
      id: `dossier-${d.id}`,
      sourceId: d.id,
      date: d.date,
      societeId: slttId,
      societeNom: slttNom,
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
      societeId: e.societeId ?? "",
      societeNom: resolveEntrySocieteNom(societes, e.societeId, e.societeNom ?? "Non affecté"),
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
      societeId: f.societeId ?? "",
      societeNom: resolveEntrySocieteNom(societes, f.societeId, f.societeNom ?? "Non affecté"),
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

interface ClasseurMouvementRow {
  id: string;
  source_id: string;
  date: string;
  societe_id: string | null;
  societe_nom: string;
  type: ClasseurType;
  reference: string;
  libelle: string;
  debit: number | string;
  credit: number | string;
  statut: string;
  solde_cumule: number | string;
}

function mapClasseurRowFromDb(row: ClasseurMouvementRow): ClasseurEntry {
  return {
    id: row.id,
    sourceId: row.source_id,
    date: row.date,
    societeId: row.societe_id ?? "",
    societeNom: row.societe_nom,
    type: row.type,
    reference: row.reference,
    libelle: row.libelle,
    debit: Number(row.debit),
    credit: Number(row.credit),
    statut: row.statut,
    soldeCumule: Number(row.solde_cumule),
  };
}

export async function fetchClasseurMouvements(clientId: string): Promise<ClasseurEntry[] | null> {
  const { data, error } = await supabase
    .from("classeur_mouvements")
    .select("*")
    .eq("client_id", clientId)
    .order("date", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[classeur] Vue SQL indisponible, repli sur le calcul client-side :", error.message);
    }
    return null;
  }
  return (data as ClasseurMouvementRow[]).map(mapClasseurRowFromDb);
}

export interface ClasseurFilters {
  societeId: "all" | string;
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
    if (filters.societeId !== "all" && e.societeId !== filters.societeId) return false;
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
  parSociete: Array<{ societeNom: string; soldeNet: number }>;
}

export function computeClasseurTotals(filteredEntries: ClasseurEntry[]): ClasseurTotals {
  const totalDebit = filteredEntries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = filteredEntries.reduce((s, e) => s + e.credit, 0);

  const bySociete = new Map<string, number>();
  for (const e of filteredEntries) {
    bySociete.set(e.societeNom, (bySociete.get(e.societeNom) ?? 0) + (e.debit - e.credit));
  }

  return {
    totalDebit,
    totalCredit,
    soldeNet: totalDebit - totalCredit,
    parSociete: Array.from(bySociete.entries()).map(([societeNom, soldeNet]) => ({ societeNom, soldeNet })),
  };
}

export function classeurEntrySourceType(entry: ClasseurEntry): MouvementSourceType {
  if (entry.type === "Dossier") return "dossier";
  if (entry.type === "Paiement") return "ecriture";
  return "facture";
}

/** Suivi horodaté d'un mouvement (audit lié à source_type / source_id). */
export async function fetchMouvementSuivi(
  sourceType: MouvementSourceType,
  sourceId: string,
): Promise<AuditEntry[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("source_type", sourceType)
    .eq("source_id", sourceId)
    .order("date", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[classeur] Suivi mouvement indisponible :", error.message);
    }
    return [];
  }

  return (data as Record<string, unknown>[]).map(mapAuditLogFromDb);
}

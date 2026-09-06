/**
 * Classeur client (retour client V1, section 3) — journal chronologique
 * unifié de tous les mouvements d'un client, toutes activités confondues
 * (dossiers de transit SLTT, écritures/bons de paiement, factures).
 */
import type { AuditEntry } from "@/lib/audit";
import { mapAuditLogFromDb, type AuditSourceType } from "@/lib/audit";
import type { Dossier, Ecriture, Facture, Societe } from "@/lib/domain-types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { logWarn } from "@/shared/logger";
import { resolveSlttBrand } from "@/lib/societe-brand";

export { resolveSlttBrand };

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

/** Identité imprimée du classeur — société unique SLTT (branding). */
export function resolveClasseurBrandNom(societes: Societe[]): string {
  return resolveSlttBrand(societes)?.nom || societes[0]?.nom || "SLTT";
}

/** Construit le journal complet (non filtré), trié chronologiquement, avec solde cumulé réel. */
export function buildClasseurJournal(
  clientId: string,
  dossiers: Dossier[],
  ecritures: Ecriture[],
  factures: Facture[],
  societes: Societe[],
): ClasseurEntry[] {
  void resolveClasseurBrandNom(societes);
  const unsorted: Omit<ClasseurEntry, "soldeCumule">[] = [];

  for (const d of dossiers) {
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
    if (f.clientId !== clientId || f.dossierId) continue;
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

interface ClasseurMouvementRow {
  id: string;
  source_id: string;
  date: string;
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
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from("classeur_mouvements")
    .select("*")
    .eq("client_id", clientId)
    .order("date", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      logWarn("[classeur] Vue SQL indisponible, repli sur le calcul client-side", error, {
        message: error.message,
      });
    }
    return null;
  }
  return (data as ClasseurMouvementRow[]).map(mapClasseurRowFromDb);
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
  parSociete: Array<{ societeNom: string; soldeNet: number }>;
}

export function computeClasseurTotals(
  filteredEntries: ClasseurEntry[],
  brandNom = "SLTT",
): ClasseurTotals {
  const totalDebit = filteredEntries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = filteredEntries.reduce((s, e) => s + e.credit, 0);
  const soldeNet = totalDebit - totalCredit;

  return {
    totalDebit,
    totalCredit,
    soldeNet,
    parSociete: [{ societeNom: brandNom, soldeNet }],
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
      logWarn("[classeur] Suivi mouvement indisponible", error, { message: error.message });
    }
    return [];
  }

  return (data as Record<string, unknown>[]).map(mapAuditLogFromDb);
}

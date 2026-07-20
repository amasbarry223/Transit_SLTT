/**
 * Classeur client (retour client V1, section 3) — journal chronologique
 * unifié de tous les mouvements d'un client, toutes activités confondues
 * (dossiers de transit SLTT, écritures/bons de paiement, factures).
 *
 * Source de vérité : la vue SQL `public.classeur_mouvements` (migration
 * 20260727_classeur_mouvements_view.sql, section 4 du retour client) —
 * mêmes règles métier, calculées côté base avec le solde cumulé en window
 * function. `fetchClasseurMouvements()` l'interroge ; si la migration
 * n'est pas encore appliquée sur l'instance Supabase (relation absente),
 * on retombe silencieusement sur `buildClasseurJournal()`, qui recalcule
 * exactement la même chose à partir des données déjà chargées dans le
 * store. Reprend la même règle de non-double-comptage que
 * client-stats.ts : seules les écritures SANS dossierId sont comptées
 * (les écritures liées à un dossier sont déjà reflétées dans
 * dossier.montantPaye).
 */
import type { Dossier, Ecriture, Facture, Societe } from "@/lib/domain-types";
import { supabase } from "@/lib/supabase";
import type { SocieteBrand } from "@/lib/export";

/** ID fixe de la société transit (cf. 20260713_societes.sql / 20260724_societe_identite_legale.sql).
 * Les dossiers n'ont pas de societe_id en base : le transit est exclusivement porté par cette société. */
export const SLTT_SOCIETE_ID = "22222222-2222-2222-2222-222222222222";
const SLTT_FALLBACK_NOM = "Traoré Transit Logistique";

/**
 * Identité SLTT prête à passer aux fonctions d'impression (printDevis,
 * printClasseur, printClients…) — tout ce qui est intrinsèquement
 * transit/SLTT (pas de societe_id en base, cf. plus haut). Les documents
 * société-scopés (facture, bon) résolvent leur propre société directement.
 */
export function resolveSlttBrand(societes: Societe[]): SocieteBrand {
  const s = societes.find((x) => x.id === SLTT_SOCIETE_ID);
  return {
    nom: s?.nom ?? SLTT_FALLBACK_NOM,
    logoUrl: s?.logoUrl,
    legal: s ? { adresse: s.adresse, telephone: s.telephone, rccm: s.rccm, nif: s.nif } : undefined,
  };
}

export type ClasseurType = "Dossier" | "Paiement" | "Facture";

export interface ClasseurEntry {
  id: string;
  /** ID brut de l'enregistrement source (dossier/écriture/facture), pour naviguer vers son détail. */
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

function resolveSocieteNom(societes: Societe[], societeId: string, fallback: string): string {
  return societes.find((s) => s.id === societeId)?.nom ?? fallback;
}

/** Construit le journal complet (non filtré), trié chronologiquement, avec solde cumulé réel. */
export function buildClasseurJournal(
  clientId: string,
  dossiers: Dossier[],
  ecritures: Ecriture[],
  factures: Facture[],
  societes: Societe[],
): ClasseurEntry[] {
  const sltNom = resolveSocieteNom(societes, SLTT_SOCIETE_ID, SLTT_FALLBACK_NOM);
  const unsorted: Omit<ClasseurEntry, "soldeCumule">[] = [];

  for (const d of dossiers) {
    if (d.clientId !== clientId) continue;
    unsorted.push({
      id: `dossier-${d.id}`,
      sourceId: d.id,
      date: d.date,
      societeId: SLTT_SOCIETE_ID,
      societeNom: sltNom,
      type: "Dossier",
      reference: d.reference,
      libelle: `Dossier transit — ${d.nature}`,
      debit: d.montantInvesti,
      credit: d.montantPaye,
      statut: d.statut,
    });
  }

  // Écritures liées à un dossier déjà reflétées dans dossier.montantPaye — exclues ici.
  for (const e of ecritures) {
    if (e.clientId !== clientId || e.dossierId) continue;
    unsorted.push({
      id: `ecriture-${e.id}`,
      sourceId: e.id,
      date: e.date,
      societeId: e.societeId ?? "",
      societeNom: e.societeNom ?? "Non affecté",
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
      societeNom: f.societeNom ?? "Non affecté",
      type: "Facture",
      reference: f.numero,
      libelle: f.lignes[0]?.description || "Facture",
      // Une facture annulée n'engage plus le client — ne pèse pas sur le solde.
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

/**
 * Interroge la vue SQL `classeur_mouvements` pour un client. Retourne
 * `null` (plutôt que lever) si la vue est indisponible — migration pas
 * encore appliquée, ou tout autre souci réseau/base — pour laisser
 * l'appelant retomber sur `buildClasseurJournal()` sans casser l'écran.
 */
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

/** Totaux sur les lignes affichées (filtrées) + répartition par société sur le journal complet. */
export function computeClasseurTotals(
  filteredEntries: ClasseurEntry[],
  fullJournal: ClasseurEntry[],
): ClasseurTotals {
  const totalDebit = filteredEntries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = filteredEntries.reduce((s, e) => s + e.credit, 0);

  const bySociete = new Map<string, number>();
  for (const e of fullJournal) {
    bySociete.set(e.societeNom, (bySociete.get(e.societeNom) ?? 0) + (e.debit - e.credit));
  }

  return {
    totalDebit,
    totalCredit,
    soldeNet: totalDebit - totalCredit,
    parSociete: Array.from(bySociete.entries()).map(([societeNom, soldeNet]) => ({ societeNom, soldeNet })),
  };
}

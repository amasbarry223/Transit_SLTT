/**
 * Calculs financiers d'un dossier — fiche Excel "Situation du client".
 * Source unique côté front (formulaire, récapitulatif, listes, PDF, tableau
 * de bord, situation client). Copie conforme :
 * backend/src/modules/dossiers/dossier-finances.ts (mêmes cas de test dans les
 * deux specs — toute modification doit être reportée). Le serveur refait ce
 * calcul à chaque lecture/écriture.
 *
 *   montantPaye   = Σ paiements
 *   resteAPayer   = total contrat − montant payé   (négatif = trop-perçu)
 *   totalDepenses = Σ dépenses
 *   beneficeNet   = total contrat − total dépenses
 */
import type { RawDossierDepense, RawDossierPaiement } from "@/lib/api-types";
import type { Dossier } from "@/lib/domain-types";

export const CATEGORIES_DEPENSE = [
  "DOUANE",
  "TRANSPORT",
  "MANUTENTION",
  "FRAIS_PORTUAIRES",
  "AVANCE",
  "DIVERS",
] as const;
export type CategorieDepense = (typeof CATEGORIES_DEPENSE)[number];

export const CATEGORIE_DEPENSE_LABELS: Record<CategorieDepense, string> = {
  DOUANE: "Douane",
  TRANSPORT: "Transport",
  MANUTENTION: "Manutention",
  FRAIS_PORTUAIRES: "Frais portuaires",
  AVANCE: "Avance",
  DIVERS: "Divers",
};

export const MODES_PAIEMENT = ["ESPECES", "VIREMENT", "CHEQUE", "ORANGE_MONEY", "WAVE"] as const;
export type ModePaiementDossier = (typeof MODES_PAIEMENT)[number];

export const MODE_PAIEMENT_LABELS: Record<ModePaiementDossier, string> = {
  ESPECES: "Espèces",
  VIREMENT: "Virement",
  CHEQUE: "Chèque",
  ORANGE_MONEY: "Orange Money",
  WAVE: "Wave",
};

export type StatutPaiement = "SOLDE" | "PARTIEL" | "IMPAYE" | "TROP_PERCU";

export const STATUT_PAIEMENT_LABELS: Record<StatutPaiement, string> = {
  SOLDE: "Soldé",
  PARTIEL: "Partiel",
  IMPAYE: "Impayé",
  TROP_PERCU: "Trop-perçu",
};

export interface DepenseDossier {
  id?: string;
  /** AAAA-MM-JJ */
  date: string;
  nature: string;
  categorie: CategorieDepense;
  montant: number;
}

export interface PaiementDossier {
  id?: string;
  /** AAAA-MM-JJ */
  date: string;
  montant: number;
  mode: ModePaiementDossier;
  reference?: string;
}

export interface FinancesDossierInput {
  totalContrat?: number | null;
  paiements?: ReadonlyArray<{ montant: number }> | null;
  depenses?: ReadonlyArray<{ montant: number }> | null;
}

export interface FinancesDossier {
  totalContrat: number;
  montantPaye: number;
  resteAPayer: number;
  totalDepenses: number;
  beneficeNet: number;
  statutPaiement: StatutPaiement;
  perte: boolean;
}

/** FCFA entier (les montants n'ont pas de sous-unité). */
export function toFcfa(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

const somme = (lignes?: ReadonlyArray<{ montant: number }> | null) =>
  (lignes ?? []).reduce((s, l) => s + toFcfa(l.montant), 0);

export function statutPaiement(totalContrat: number, montantPaye: number): StatutPaiement {
  const reste = totalContrat - montantPaye;
  if (reste < 0) return "TROP_PERCU";
  if (reste === 0) return "SOLDE";
  if (montantPaye === 0 && totalContrat > 0) return "IMPAYE";
  return "PARTIEL";
}

export function calculerFinancesDossier(d: FinancesDossierInput): FinancesDossier {
  const totalContrat = toFcfa(d.totalContrat);
  const montantPaye = somme(d.paiements);
  const totalDepenses = somme(d.depenses);
  const beneficeNet = totalContrat - totalDepenses;
  return {
    totalContrat,
    montantPaye,
    resteAPayer: totalContrat - montantPaye,
    totalDepenses,
    beneficeNet,
    statutPaiement: statutPaiement(totalContrat, montantPaye),
    perte: beneficeNet < 0,
  };
}

/** Champs d'un `Dossier` nécessaires au calcul. */
export interface DossierFinancesSource {
  totalContrat: number;
  /** Cache serveur de Σ paiements — utilisé si le détail n'est pas chargé. */
  montantPaye: number;
  paiements?: ReadonlyArray<{ montant: number }>;
  depenses?: ReadonlyArray<{ montant: number }>;
}

export function financesDossier(d: DossierFinancesSource): FinancesDossier {
  return calculerFinancesDossier({
    totalContrat: d.totalContrat,
    paiements: d.paiements ?? [{ montant: d.montantPaye }],
    depenses: d.depenses,
  });
}

/** Reste dû par le client, sans le trop-perçu (pour les alertes et cumuls). */
export function resteDuDossier(d: DossierFinancesSource): number {
  return Math.max(0, financesDossier(d).resteAPayer);
}

const jour = (v?: string | null) => (v ? String(v).slice(0, 10) : new Date().toISOString().slice(0, 10));

/** Lignes renvoyées par l'API (noms Prisma exacts) → lignes du domaine. */
export function lignesDossierDepuisApi(raw: {
  depensesDossier?: RawDossierDepense[];
  paiements?: RawDossierPaiement[];
}): Pick<Dossier, "depenses" | "paiements"> {
  return {
    depenses: (raw.depensesDossier ?? []).map((l) => ({
      id: l.id,
      date: jour(l.date),
      nature: l.nature ?? "",
      categorie: (CATEGORIES_DEPENSE as readonly string[]).includes(l.categorie ?? "")
        ? (l.categorie as CategorieDepense)
        : "DIVERS",
      montant: toFcfa(l.montant),
    })),
    paiements: (raw.paiements ?? []).map((p) => ({
      id: p.id,
      date: jour(p.date),
      montant: toFcfa(p.montant),
      mode: (MODES_PAIEMENT as readonly string[]).includes(p.mode ?? "")
        ? (p.mode as ModePaiementDossier)
        : "ESPECES",
      reference: p.reference ?? undefined,
    })),
  };
}

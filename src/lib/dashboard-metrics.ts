import type { Dossier, Ecriture, Facture, StockItem } from "@/lib/domain-types";
import { resteAPayer, calculerEcart } from "@/lib/domain-types";
import { formatFCFA, parseLocalDate } from "@/lib/format";
import { filterBySocieteAndPeriode } from "@/lib/benefice";
import {
  CHART_MONTHS_COUNT,
  CHART_MONTHS_OFFSET,
  ECHEANCE_IMMINENTE_JOURS,
  MS_PER_DAY,
} from "@/lib/constants";
import { DOSSIER_STATUT_HEX } from "@/components/sltt/status-badge";

export const DASHBOARD_CHART_MONTHS = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
];

export interface LiveAlert {
  id: string;
  niveau: "danger" | "warning";
  message: string;
  detail: string;
  /** Où l'alerte doit naviguer au clic — toujours le sujet réel de l'alerte. */
  target: { view: "entreposage" | "dossier-detail"; id?: string };
}

/**
 * LOGIC-03 (audit) : Écritures et Factures sont deux canaux de paiement
 * indépendants — payer une facture ne touche jamais une écriture, et
 * inversement. Ils sont donc additionnés (pas dédoublonnés) pour donner
 * un seul chiffre "encaissé" fiable au lieu de deux chiffres partiels.
 * Filtrage via filterBySocieteAndPeriode (societeId=null → pas de scope
 * société) pour un parsing de date sûr (ancré à midi, pas minuit UTC —
 * évite un décalage d'un jour selon le fuseau du navigateur).
 */
export function computeEncaisseVariation(
  ecrituresAvecDate: Ecriture[],
  factures: Facture[],
  anchorDate: Date,
): { chiffreEncaisse: number; variationEncaisse: number } {
  const curM = anchorDate.getMonth();
  const curY = anchorDate.getFullYear();
  const prevM = curM === 0 ? 11 : curM - 1;
  const prevY = curM === 0 ? curY - 1 : curY;

  const encaisseSur = (year: number, month: number) => {
    const fromEcritures = filterBySocieteAndPeriode(ecrituresAvecDate, null, year, month)
      .reduce((sum, e) => sum + e.montantPaye, 0);
    // Les factures n'ont pas de date de paiement dédiée : la date de la
    // facture est le meilleur proxy disponible.
    const fromFactures = filterBySocieteAndPeriode(factures, null, year, month)
      .reduce((sum, f) => sum + f.montantPaye, 0);
    return fromEcritures + fromFactures;
  };

  const current = encaisseSur(curY, curM);
  const prev = encaisseSur(prevY, prevM);

  const variation = prev === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - prev) / prev) * 100);
  return { chiffreEncaisse: current, variationEncaisse: variation };
}

/** Restes à payer et dossiers non soldés → source : dossiers (pas les écritures). */
export function computeRestesAPayer(dossiers: Dossier[]): {
  totalRestesAPayer: number;
  nbDossiersNonSoldes: number;
} {
  let total = 0;
  let count = 0;
  for (const d of dossiers) {
    const reste = resteAPayer(d);
    if (reste > 0) {
      total += reste;
      count += 1;
    }
  }
  return { totalRestesAPayer: total, nbDossiersNonSoldes: count };
}

export function buildEncaissementsParMois(
  ecrituresAvecDate: Ecriture[],
  anchorDate: Date,
): { mois: string; valeur: number }[] {
  return Array.from({ length: CHART_MONTHS_COUNT }, (_, index) => {
    const chartDate = new Date(
      anchorDate.getFullYear(),
      anchorDate.getMonth() - (CHART_MONTHS_OFFSET - index),
      1,
    );
    const monthIndex = chartDate.getMonth();
    const year = chartDate.getFullYear();
    const valeur = filterBySocieteAndPeriode(ecrituresAvecDate, null, year, monthIndex)
      .reduce((sum, ecriture) => sum + ecriture.montantPaye, 0);
    return { mois: DASHBOARD_CHART_MONTHS[monthIndex], valeur };
  });
}

export function buildEcartsParPeriode(
  dossiers: Dossier[],
  anchorDate: Date,
): { periode: string; ecart: number }[] {
  return Array.from({ length: CHART_MONTHS_COUNT }, (_, index) => {
    const chartDate = new Date(
      anchorDate.getFullYear(),
      anchorDate.getMonth() - (CHART_MONTHS_OFFSET - index),
      1,
    );
    const monthIndex = chartDate.getMonth();
    const year = chartDate.getFullYear();
    const ecart = filterBySocieteAndPeriode(dossiers, null, year, monthIndex)
      .reduce((sum, dossier) => sum + calculerEcart(dossier), 0);
    return { periode: DASHBOARD_CHART_MONTHS[monthIndex], ecart };
  });
}

/**
 * Uses DOSSIER_STATUT_HEX (status-badge.tsx) so the donut always agrees with
 * the DossierStatutBadge shown everywhere else — see LOGIC-04 in the audit.
 */
export function buildStatutDonutData(
  dossiers: Dossier[],
): { name: string; value: number; color: string }[] {
  const counts: Record<string, number> = {};
  for (const d of dossiers) {
    counts[d.statut] = (counts[d.statut] ?? 0) + 1;
  }
  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    color: DOSSIER_STATUT_HEX[name as keyof typeof DOSSIER_STATUT_HEX] ?? "#94A3B8",
  }));
}

export function buildLiveAlertes(stock: StockItem[], dossiers: Dossier[]): LiveAlert[] {
  const todayMs = new Date().setHours(0, 0, 0, 0);

  const lowStockAlerts: LiveAlert[] = stock
    .filter((s) => s.quantite < s.seuil)
    .map((s) => ({
      id: `stock-${s.id}`,
      niveau: "danger" as const,
      message: `Stock faible : ${s.marchandise}`,
      detail: `${s.quantite} ${s.unite} restants — ${s.depositaire}`,
      target: { view: "entreposage" as const },
    }));

  const echeanceAlerts: LiveAlert[] = dossiers
    .filter((d) => d.dateEcheance && !["Livré", "Soldé"].includes(d.statut))
    .reduce<LiveAlert[]>((acc, d) => {
      const echeance = parseLocalDate(d.dateEcheance!).setHours(0, 0, 0, 0);
      const jours = Math.ceil((echeance - todayMs) / MS_PER_DAY);
      if (jours < 0) {
        acc.push({
          id: `echeance-${d.id}`,
          niveau: "danger",
          message: `Échéance dépassée : ${d.reference.replace(/^.+-TR-/, "")}`,
          detail: `Dépassée de ${Math.abs(jours)}j — ${d.clientNom}`,
          target: { view: "dossier-detail", id: d.id },
        });
      } else if (jours <= ECHEANCE_IMMINENTE_JOURS) {
        acc.push({
          id: `echeance-${d.id}`,
          niveau: "warning",
          message: `Échéance dans ${jours}j : ${d.reference.replace(/^.+-TR-/, "")}`,
          detail: `${d.clientNom} — ${d.nature}`,
          target: { view: "dossier-detail", id: d.id },
        });
      }
      return acc;
    }, []);

  const unpaid: LiveAlert[] = dossiers
    .filter((d) => resteAPayer(d) > 0)
    .slice(0, 4)
    .map((d) => ({
      id: `dossier-${d.id}`,
      niveau: "warning" as const,
      message: `Dossier non soldé : ${d.reference}`,
      detail: `Reste à payer : ${formatFCFA(resteAPayer(d))} — ${d.clientNom}`,
      target: { view: "dossier-detail" as const, id: d.id },
    }));

  return [...lowStockAlerts, ...echeanceAlerts, ...unpaid];
}

import { resteAPayer, resteDuDossier } from "@/lib/domain-types";
import type { Client, Dossier, Facture } from "@/lib/store";

/**
 * Règle unique de l'encaissé et du dû client : le DOSSIER fait foi (fiche
 * « Situation du client »).
 *
 *   dû       = Σ total contrat des dossiers + Σ TTC des factures libres
 *   encaissé = Σ règlements des dossiers    + Σ payé des factures libres
 *
 * Une facture liée à un dossier est un document : elle n'est pas recomptée.
 * Son encaissement crée un règlement du dossier (backend factures.service →
 * enregistrerPaiement), et l'historique a été repris une fois
 * (prisma/sql/2026-10-30-reprise-encaissements-factures.sql). Même règle côté
 * serveur pour le tableau de bord (backend dashboard/creances.ts) et dans la
 * situation clients de la comptabilité (situation-clients-compta.ts).
 *
 * Avant : une facture liée « prenait la main » sur son dossier ici, alors que
 * les dossiers refondus, la situation clients et le journal suivaient le
 * dossier. Deux règles coexistaient selon l'écran.
 */

/** Factures sans dossier, ni annulées ni en brouillon. */
export function facturesLibres<T extends Pick<Facture, "dossierId" | "statut">>(factures: readonly T[]): T[] {
  return factures.filter((f) => !f.dossierId && f.statut !== "Annulée" && f.statut !== "Brouillon");
}

/**
 * Encaissé (définition unique). `inPeriode`, si fourni, filtre chaque
 * règlement de dossier sur SA date (repli sur `dateSolde` si le détail n'est
 * pas chargé) et chaque facture libre sur sa date.
 */
export function sommeEncaisse(
  dossiers: readonly Dossier[],
  factures: readonly Facture[],
  inPeriode?: (date: string) => boolean,
): number {
  const dossiersEncaisses = dossiers.reduce((sum, d) => {
    if (!inPeriode) return sum + Math.max(0, d.montantPaye);
    if (d.paiements && d.paiements.length > 0) {
      return sum + d.paiements.filter((p) => p.date && inPeriode(p.date)).reduce((s, p) => s + p.montant, 0);
    }
    return sum + (d.montantPaye > 0 && d.dateSolde && inPeriode(d.dateSolde) ? d.montantPaye : 0);
  }, 0);
  const facturesEncaissees = facturesLibres(factures)
    .filter((f) => !inPeriode || inPeriode(f.date))
    .reduce((s, f) => s + f.montantPaye, 0);
  return dossiersEncaisses + facturesEncaissees;
}

/**
 * Dépenses engagées sur les dossiers (droit de douane compris), datées ligne
 * par ligne. Tous les dossiers comptent : un coût est réel quel que soit
 * l'encaissement.
 */
export function sommeDepensesDossiers(dossiers: readonly Dossier[], inPeriode?: (date: string) => boolean): number {
  return dossiers.reduce(
    (sum, d) =>
      sum +
      (d.depenses ?? [])
        .filter((l) => !inPeriode || (l.date && inPeriode(l.date)))
        .reduce((s, l) => s + l.montant, 0),
    0,
  );
}

/**
 * Recalcule les agrégats client (règle ci-dessus). Les restes sont bornés à 0
 * par dossier / facture : un dossier en trop-perçu ne compense pas un autre
 * dossier dû.
 */
export function syncClientStats(
  dossiers: Dossier[],
  factures: Facture[],
  clients: Client[],
): Client[] {
  return clients.map((c) => {
    const cd = dossiers.filter((d) => d.clientId === c.id);
    const cfl = facturesLibres(factures.filter((f) => f.clientId === c.id));
    return {
      ...c,
      nbDossiers: cd.length,
      totalPaye:
        cd.reduce((s, d) => s + d.montantPaye, 0) +
        cfl.reduce((s, f) => s + f.montantPaye, 0),
      totalDu:
        cd.reduce((s, d) => s + resteDuDossier(d), 0) +
        cfl.reduce((s, f) => s + resteAPayer({ montantInvesti: f.montantTTC, montantPaye: f.montantPaye }), 0),
      totalInvesti:
        cd.reduce((s, d) => s + d.totalContrat, 0) +
        cfl.reduce((s, f) => s + f.montantTTC, 0),
    };
  });
}

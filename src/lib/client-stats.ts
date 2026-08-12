import { resteAPayer } from "@/lib/domain-types";
import type { Client, Dossier, Ecriture, Facture } from "@/lib/store";

/**
 * Somme des montants payés sur des factures actives — exclut les factures
 * `Annulée`, dont l'encaissement ne doit plus compter dans un total global
 * une fois la facture annulée. Fonction unique réutilisée par tout écran
 * agrégeant des paiements de factures (Dashboard, Bilans, fiche client),
 * pour qu'ils ne divergent jamais sur ce total.
 */
export function sommeFacturesEncaissees(factures: Facture[]): number {
  return factures.filter((f) => f.statut !== "Annulée").reduce((sum, f) => sum + f.montantPaye, 0);
}

/**
 * Recalcule les agrégats client à partir des dossiers, factures et écritures.
 * Les factures déjà rattachées à un dossier du client sont exclues pour éviter
 * le double comptage (le dossier porte déjà l'encours).
 */
export function syncClientStats(
  dossiers: Dossier[],
  factures: Facture[],
  ecritures: Ecriture[],
  clients: Client[],
): Client[] {
  return clients.map((c) => {
    const cd = dossiers.filter((d) => d.clientId === c.id);
    const dossierIds = new Set(cd.map((d) => d.id));
    const cf = factures.filter(
      (f) => f.clientId === c.id && !(f.dossierId && dossierIds.has(f.dossierId)),
    );
    const ce = ecritures.filter((e) => e.clientId === c.id && !e.dossierId);
    return {
      ...c,
      nbDossiers: cd.length,
      totalPaye:
        cd.reduce((s, d) => s + d.montantPaye, 0) +
        sommeFacturesEncaissees(cf) +
        ce.reduce((s, e) => s + e.montantPaye, 0),
      totalDu:
        cd.reduce((s, d) => s + resteAPayer(d), 0) +
        ce.reduce((s, e) => s + resteAPayer(e), 0) +
        cf
          .filter((f) => f.statut !== "Annulée")
          .reduce((s, f) => s + resteAPayer({ montantInvesti: f.montantTTC, montantPaye: f.montantPaye }), 0),
    };
  });
}

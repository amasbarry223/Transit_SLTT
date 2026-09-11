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
 * Règlements reçus sur les dossiers NON facturés — quand un dossier n'a pas de
 * facture, c'est lui qui porte le montant encaissé (même règle que les bilans
 * et syncClientStats). `inPeriode`, si fourni, filtre sur `dateSolde`.
 */
export function sommeDossiersEncaisses(
  dossiers: Dossier[],
  factures: Facture[],
  inPeriode?: (dateSolde: string) => boolean,
): number {
  const facturedDossierIds = new Set(
    factures.map((f) => f.dossierId).filter((x): x is string => Boolean(x)),
  );
  return dossiers
    .filter((d) => !facturedDossierIds.has(d.id) && d.montantPaye > 0)
    .filter((d) => !inPeriode || (d.dateSolde ? inPeriode(d.dateSolde) : false))
    .reduce((sum, d) => sum + d.montantPaye, 0);
}

/**
 * Recalcule les agrégats client à partir des dossiers, factures et écritures.
 *
 * Un dossier facturé est exclu du total (pas sa facture) : une fois qu'une
 * facture est générée à partir d'un dossier, c'est elle qui devient la
 * source de vérité de l'encaissement (elle peut inclure la TVA, avoir son
 * propre historique de paiement) — même convention que sommeDossiersEncaisses
 * et les Bilans (use-bilans-screen.ts). Avant ce correctif, c'était l'inverse
 * (la facture était exclue, le dossier gardait son propre montantPaye) : un
 * dossier réglé avant sa facturation, puis facturé et réglé une seconde fois
 * via la facture, voyait les deux montants s'additionner sur la fiche client
 * — ni le Dashboard ni les Bilans ne reproduisaient ce doublon, seule la
 * fiche client (ce fichier) divergeait.
 */
export function syncClientStats(
  dossiers: Dossier[],
  factures: Facture[],
  ecritures: Ecriture[],
  clients: Client[],
): Client[] {
  return clients.map((c) => {
    const cd = dossiers.filter((d) => d.clientId === c.id);
    const facturedDossierIds = new Set(
      factures.map((f) => f.dossierId).filter((x): x is string => Boolean(x)),
    );
    const cdNonFactures = cd.filter((d) => !facturedDossierIds.has(d.id));
    const cf = factures.filter((f) => f.clientId === c.id);
    const ce = ecritures.filter((e) => e.clientId === c.id && !e.dossierId);
    return {
      ...c,
      nbDossiers: cd.length,
      totalPaye:
        cdNonFactures.reduce((s, d) => s + d.montantPaye, 0) +
        sommeFacturesEncaissees(cf) +
        ce.reduce((s, e) => s + e.montantPaye, 0),
      totalDu:
        cdNonFactures.reduce((s, d) => s + resteAPayer(d), 0) +
        ce.reduce((s, e) => s + resteAPayer(e), 0) +
        cf
          .filter((f) => f.statut !== "Annulée")
          .reduce((s, f) => s + resteAPayer({ montantInvesti: f.montantTTC, montantPaye: f.montantPaye }), 0),
    };
  });
}

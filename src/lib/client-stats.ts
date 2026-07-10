import type { Client, Dossier, Ecriture, Facture } from "@/lib/store";

/** Recalcule les agrégats client à partir des dossiers, factures et écritures autonomes. */
export function syncClientStats(
  dossiers: Dossier[],
  factures: Facture[],
  ecritures: Ecriture[],
  clients: Client[],
): Client[] {
  return clients.map((c) => {
    const cd = dossiers.filter((d) => d.clientId === c.id);
    const cf = factures.filter((f) => f.clientId === c.id);
    const ce = ecritures.filter((e) => e.clientId === c.id && !e.dossierId);
    return {
      ...c,
      nbDossiers: cd.length,
      totalPaye:
        cd.reduce((s, d) => s + d.montantPaye, 0) +
        cf.reduce((s, f) => s + f.montantPaye, 0) +
        ce.reduce((s, e) => s + e.montantPaye, 0),
      totalDu:
        cd.reduce((s, d) => s + Math.max(0, d.montantInvesti - d.montantPaye), 0) +
        ce.reduce((s, e) => s + Math.max(0, e.montantInvesti - e.montantPaye), 0),
    };
  });
}

/**
 * "Situation du client" — reproduction de la fiche Excel : une ligne par
 * dossier du client, puis une ligne de totaux. Les montants viennent de
 * financesDossier() (dossier-finances.ts), seule source de calcul.
 */
import type { Dossier, Facture } from "@/lib/domain-types";
import { financesDossier, type FinancesDossier } from "@/lib/domain/dossier-finances";

export interface SituationLigne {
  dossier: Dossier;
  date: string;
  numero: string;
  nature: string;
  quantite?: number;
  /** Numéros des factures liées au dossier, séparés par une virgule. */
  factures: string;
  totalContrat: number;
  montantPaye: number;
  resteAPayer: number;
  beneficeNet: number;
  totalDepenses: number;
  finances: FinancesDossier;
}

export interface SituationTotaux {
  totalContrat: number;
  montantPaye: number;
  resteAPayer: number;
  beneficeNet: number;
  totalDepenses: number;
}

/** Années (AAAA) présentes dans les dossiers, de la plus récente à la plus ancienne. */
export function anneesSituation(dossiers: Dossier[]): string[] {
  return [
    ...new Set(
      dossiers
        .map((d) => (d.date || "").slice(0, 4))
        .filter((y) => y.length === 4),
    ),
  ]
    .sort()
    .reverse();
}

export function buildSituationClient(
  dossiers: Dossier[],
  factures: Pick<Facture, "dossierId" | "numero" | "statut">[] = [],
  annee: string = "all",
): { lignes: SituationLigne[]; totaux: SituationTotaux } {
  const lignes = dossiers
    .filter((d) => annee === "all" || (d.date || "").slice(0, 4) === annee)
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
    .map((d) => {
      const f = financesDossier(d);
      return {
        dossier: d,
        date: d.date || "",
        numero: d.reference || d.id,
        nature: d.nature || "",
        quantite: d.nombreColis,
        factures: (factures || [])
          .filter((fa) => fa.dossierId === d.id && fa.statut !== "Annulée")
          .map((fa) => fa.numero)
          .join(", "),
        totalContrat: f.totalContrat,
        montantPaye: f.montantPaye,
        resteAPayer: f.resteAPayer,
        beneficeNet: f.beneficeNet,
        totalDepenses: f.totalDepenses,
        finances: f,
      };
    });

  const totaux = lignes.reduce<SituationTotaux>(
    (t, l) => ({
      totalContrat: t.totalContrat + l.totalContrat,
      montantPaye: t.montantPaye + l.montantPaye,
      resteAPayer: t.resteAPayer + l.resteAPayer,
      beneficeNet: t.beneficeNet + l.beneficeNet,
      totalDepenses: t.totalDepenses + l.totalDepenses,
    }),
    { totalContrat: 0, montantPaye: 0, resteAPayer: 0, beneficeNet: 0, totalDepenses: 0 },
  );

  return { lignes, totaux };
}

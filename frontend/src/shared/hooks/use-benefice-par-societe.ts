import { useMemo } from "react";

import { computeBenefice, filterByPeriode } from "@/lib/benefice";
import { getDashboardAnchorDate } from "@/lib/calendar-anchor";
import { parseLocalDate } from "@/lib/format";
import { sommeDepensesDossiers, sommeEncaisse } from "@/lib/client-stats";
import { useStore } from "@/lib/store";

export type BeneficeMensuel = {
  recettes: number;
  depenses: number;
  benefice: number;
};

/** Bénéfice mensuel consolidé — recettes (règlements de dossiers + factures libres), dépenses (bons de caisse, dossiers). */
export function useBeneficeParSociete(anchorDate: Date = getDashboardAnchorDate()) {
  const factures = useStore((s) => s.factures);
  const dossiers = useStore((s) => s.dossiers);
  const bonsSortieCaisse = useStore((s) => s.bonsSortieCaisse);

  const caisseAvecDate = useMemo(
    () =>
      bonsSortieCaisse.flatMap((b) =>
        b.lignes.map((l) => ({
          annexeId: b.annexeId,
          date: l.date,
          montant: l.montant,
        })),
      ),
    [bonsSortieCaisse],
  );

  const annee = anchorDate.getFullYear();
  const mois = anchorDate.getMonth();

  return useMemo(() => {
    const dansLeMois = (iso: string) => {
      const d = parseLocalDate(iso);
      return !Number.isNaN(d.getTime()) && d.getFullYear() === annee && d.getMonth() === mois;
    };
    const recettes =
      // Encaissé du mois : définition unique (client-stats.ts → sommeEncaisse).
      sommeEncaisse(dossiers, factures, dansLeMois);
    const depensesMois =
      filterByPeriode(caisseAvecDate, annee, mois).reduce(
        (sum, d) => sum + d.montant,
        0,
      ) +
      // Dépenses saisies sur les dossiers (refonte « Situation du client ») :
      // absentes du bénéfice avant ce correctif.
      sommeDepensesDossiers(dossiers, dansLeMois);
    const consolide: BeneficeMensuel = {
      recettes,
      depenses: depensesMois,
      benefice: computeBenefice(recettes, depensesMois),
    };

    return {
      caisseAvecDate,
      consolide,
    };
  }, [caisseAvecDate, factures, dossiers, annee, mois]);
}

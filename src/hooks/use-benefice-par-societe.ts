import { useMemo } from "react";

import { filterBySocieteAndPeriode, computeBenefice } from "@/lib/benefice";
import { getDashboardAnchorDate } from "@/lib/calendar-anchor";
import type { Societe } from "@/lib/domain-types";
import { useStore } from "@/lib/store";

export type BeneficeMensuel = {
  recettes: number;
  depenses: number;
  benefice: number;
};

export type BeneficeParSocieteEntry = BeneficeMensuel & {
  societe: Societe;
};

/** Bénéfice mensuel par société — écritures sur datePaiement (F5), dépenses + caisse (F1). */
export function useBeneficeParSociete(anchorDate: Date = getDashboardAnchorDate()) {
  const ecritures = useStore((s) => s.ecritures);
  const factures = useStore((s) => s.factures);
  const depenses = useStore((s) => s.depenses);
  const bonsSortieCaisse = useStore((s) => s.bonsSortieCaisse);
  const societes = useStore((s) => s.societes);

  const ecrituresAvecDate = useMemo(
    () => ecritures.map((e) => ({ ...e, date: e.datePaiement ?? e.date })),
    [ecritures],
  );
  const depensesAvecDate = useMemo(
    () => depenses.map((d) => ({ ...d, date: d.dateDepense })),
    [depenses],
  );
  const caisseAvecDate = useMemo(
    () =>
      bonsSortieCaisse.flatMap((b) =>
        b.lignes.map((l) => ({
          societeId: b.societeId as string | undefined,
          date: l.date,
          montant: l.montant,
        })),
      ),
    [bonsSortieCaisse],
  );

  const annee = anchorDate.getFullYear();
  const mois = anchorDate.getMonth();

  return useMemo(() => {
    const calculerBeneficeMensuel = (societeId: string | null): BeneficeMensuel => {
      const recettes =
        filterBySocieteAndPeriode(ecrituresAvecDate, societeId, annee, mois).reduce(
          (sum, e) => sum + e.montantPaye,
          0,
        ) +
        filterBySocieteAndPeriode(factures, societeId, annee, mois).reduce(
          (sum, f) => sum + f.montantPaye,
          0,
        );
      const depensesMois =
        filterBySocieteAndPeriode(depensesAvecDate, societeId, annee, mois).reduce(
          (sum, d) => sum + d.montant,
          0,
        ) +
        filterBySocieteAndPeriode(caisseAvecDate, societeId, annee, mois).reduce(
          (sum, d) => sum + d.montant,
          0,
        );
      return { recettes, depenses: depensesMois, benefice: computeBenefice(recettes, depensesMois) };
    };

    return {
      ecrituresAvecDate,
      depensesAvecDate,
      caisseAvecDate,
      consolide: calculerBeneficeMensuel(null),
      parSociete: societes.map((societe) => ({
        societe,
        ...calculerBeneficeMensuel(societe.id),
      })),
      calculerBeneficeMensuel,
    };
  }, [ecrituresAvecDate, depensesAvecDate, caisseAvecDate, factures, societes, annee, mois]);
}

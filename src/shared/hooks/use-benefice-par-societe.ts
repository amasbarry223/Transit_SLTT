import { useMemo } from "react";

import { computeBenefice } from "@/lib/benefice";
import { getDashboardAnchorDate } from "@/lib/calendar-anchor";
import { parseLocalDate } from "@/lib/format";
import { sommeDossiersEncaisses } from "@/lib/client-stats";
import { useStore } from "@/lib/store";

export type BeneficeMensuel = {
  recettes: number;
  depenses: number;
  benefice: number;
};

function filterByPeriode<T extends { date: string }>(
  rows: T[],
  year: number,
  month: number,
): T[] {
  return rows.filter((row) => {
    const d = parseLocalDate(row.date);
    if (Number.isNaN(d.getTime())) return false;
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

/** Bénéfice mensuel consolidé — écritures sur datePaiement (F5), dépenses + caisse (F1). */
export function useBeneficeParSociete(anchorDate: Date = getDashboardAnchorDate()) {
  const ecritures = useStore((s) => s.ecritures);
  const factures = useStore((s) => s.factures);
  const dossiers = useStore((s) => s.dossiers);
  const depenses = useStore((s) => s.depenses);
  const bonsSortieCaisse = useStore((s) => s.bonsSortieCaisse);

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
      filterByPeriode(ecrituresAvecDate, annee, mois).reduce(
        (sum, e) => sum + e.montantPaye,
        0,
      ) +
      filterByPeriode(factures, annee, mois).reduce(
        (sum, f) => sum + f.montantPaye,
        0,
      ) +
      // Dossiers réglés directement (sans facture) : le montantPaye du dossier
      // persiste désormais, il ne disparaît plus au rechargement.
      sommeDossiersEncaisses(dossiers, factures, dansLeMois);
    const depensesMois =
      filterByPeriode(depensesAvecDate, annee, mois).reduce(
        (sum, d) => sum + d.montant,
        0,
      ) +
      filterByPeriode(caisseAvecDate, annee, mois).reduce(
        (sum, d) => sum + d.montant,
        0,
      );
    const consolide: BeneficeMensuel = {
      recettes,
      depenses: depensesMois,
      benefice: computeBenefice(recettes, depensesMois),
    };

    return {
      ecrituresAvecDate,
      depensesAvecDate,
      caisseAvecDate,
      consolide,
    };
  }, [ecrituresAvecDate, depensesAvecDate, caisseAvecDate, factures, dossiers, annee, mois]);
}

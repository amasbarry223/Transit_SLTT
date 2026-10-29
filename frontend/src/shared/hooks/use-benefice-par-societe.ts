import { useMemo } from "react";

import { computeBenefice, filterByPeriode } from "@/lib/benefice";
import { getDashboardAnchorDate } from "@/lib/calendar-anchor";
import { parseLocalDate } from "@/lib/format";
import { sommeDepensesDossiers, sommeDossiersEncaisses, sommeFacturesEncaissees } from "@/lib/client-stats";
import { useStore } from "@/lib/store";

export type BeneficeMensuel = {
  recettes: number;
  depenses: number;
  benefice: number;
};

/** Bénéfice mensuel consolidé — recettes (factures + règlements de dossiers), dépenses (contrats, caisse, dossiers). */
export function useBeneficeParSociete(anchorDate: Date = getDashboardAnchorDate()) {
  const factures = useStore((s) => s.factures);
  const dossiers = useStore((s) => s.dossiers);
  const depenses = useStore((s) => s.depenses);
  const bonsSortieCaisse = useStore((s) => s.bonsSortieCaisse);

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
      // sommeFacturesEncaissees exclut les factures Annulée — une facture
      // encaissée puis annulée ne doit plus compter dans le bénéfice affiché
      // (même règle que client-stats.ts / dashboard-metrics.ts). Un reduce
      // local ici recomptait ce montant sans jamais l'exclure.
      sommeFacturesEncaissees(filterByPeriode(factures, annee, mois)) +
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
      depensesAvecDate,
      caisseAvecDate,
      consolide,
    };
  }, [depensesAvecDate, caisseAvecDate, factures, dossiers, annee, mois]);
}

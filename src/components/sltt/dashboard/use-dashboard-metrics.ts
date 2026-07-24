"use client";

import { useMemo } from "react";
import type { Dossier, Ecriture, Facture, StockItem } from "@/lib/domain-types";
import {
  buildEcartsParPeriode,
  buildEncaissementsParMois,
  buildLiveAlertes,
  buildStatutDonutData,
  computeEncaisseVariation,
  computeRestesAPayer,
  type LiveAlert,
} from "@/lib/dashboard-metrics";
import { CHART_MONTHS_COUNT } from "@/lib/constants";

export function useDashboardMetrics({
  dossiers,
  factures,
  stock,
  ecrituresAvecDate,
  anchorDate,
}: {
  dossiers: Dossier[];
  factures: Facture[];
  stock: StockItem[];
  ecrituresAvecDate: Ecriture[];
  anchorDate: Date;
}) {
  const { chiffreEncaisse, variationEncaisse } = useMemo(
    () => computeEncaisseVariation(ecrituresAvecDate, factures, anchorDate),
    [ecrituresAvecDate, factures, anchorDate],
  );

  const { totalRestesAPayer, nbDossiersNonSoldes } = useMemo(
    () => computeRestesAPayer(dossiers),
    [dossiers],
  );

  const dossiersEnCours = useMemo(
    () => dossiers.filter((d) => d.statut === "En cours").length,
    [dossiers],
  );

  // Dossiers dédouanés en attente de livraison (sublabel du KPI "En cours")
  const dossiersALivrer = useMemo(
    () => dossiers.filter((d) => d.statut === "Dédouané").length,
    [dossiers],
  );

  const valeurStock = useMemo(
    () => stock.reduce((sum, s) => sum + s.sommePayee + s.resteAPayer, 0),
    [stock],
  );

  const encaissementsParMois = useMemo(
    () => buildEncaissementsParMois(ecrituresAvecDate, anchorDate),
    [ecrituresAvecDate, anchorDate],
  );

  const ecartsParPeriode = useMemo(
    () => buildEcartsParPeriode(dossiers, anchorDate),
    [dossiers, anchorDate],
  );

  const derniersDossiers = useMemo(
    () =>
      [...dossiers]
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
        .slice(0, CHART_MONTHS_COUNT),
    [dossiers],
  );

  const statutDonutData = useMemo(() => buildStatutDonutData(dossiers), [dossiers]);

  const totalDossiers = dossiers.length;

  const alertes = useMemo<LiveAlert[]>(() => buildLiveAlertes(stock, dossiers), [stock, dossiers]);

  return {
    chiffreEncaisse,
    variationEncaisse,
    totalRestesAPayer,
    nbDossiersNonSoldes,
    dossiersEnCours,
    dossiersALivrer,
    valeurStock,
    encaissementsParMois,
    ecartsParPeriode,
    derniersDossiers,
    statutDonutData,
    totalDossiers,
    alertes,
  };
}

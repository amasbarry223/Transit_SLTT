"use client";

import { useMemo } from "react";
import type { Dossier, Ecriture, Facture, OperationComptable, StockItem } from "@/lib/domain-types";
import {
  buildDossiersParMois,
  buildLiveAlertes,
  buildStockRepartition,
  buildTresorerieParMois,
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
  operationsComptables,
  anchorDate,
}: {
  dossiers: Dossier[];
  factures: Facture[];
  stock: StockItem[];
  ecrituresAvecDate: Ecriture[];
  operationsComptables: OperationComptable[];
  anchorDate: Date;
}) {
  const { chiffreEncaisse, variationEncaisse } = useMemo(
    () => computeEncaisseVariation(ecrituresAvecDate, factures, anchorDate, dossiers),
    [ecrituresAvecDate, factures, anchorDate, dossiers],
  );

  const { totalRestesAPayer, nbDossiersNonSoldes } = useMemo(
    () => computeRestesAPayer(dossiers, factures),
    [dossiers, factures],
  );

  const dossiersEnCours = useMemo(
    () => dossiers.filter((d) => d.statut === "En cours").length,
    [dossiers],
  );

  const dossiersALivrer = useMemo(
    () => dossiers.filter((d) => d.statut === "Dédouané").length,
    [dossiers],
  );

  const valeurStock = useMemo(
    () => stock.reduce((sum, s) => sum + s.sommePayee + s.resteAPayer, 0),
    [stock],
  );

  const dossiersParMois = useMemo(
    () => buildDossiersParMois(dossiers, anchorDate),
    [dossiers, anchorDate],
  );

  const stockRepartition = useMemo(() => buildStockRepartition(stock), [stock]);

  const tresorerieParMois = useMemo(
    () => buildTresorerieParMois(operationsComptables, anchorDate),
    [operationsComptables, anchorDate],
  );

  const derniersDossiers = useMemo(
    () =>
      [...dossiers]
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
        .slice(0, CHART_MONTHS_COUNT),
    [dossiers],
  );

  const alertes = useMemo<LiveAlert[]>(
    () => buildLiveAlertes(stock, dossiers, factures),
    [stock, dossiers, factures],
  );

  return {
    chiffreEncaisse,
    variationEncaisse,
    totalRestesAPayer,
    nbDossiersNonSoldes,
    dossiersEnCours,
    dossiersALivrer,
    valeurStock,
    dossiersParMois,
    stockRepartition,
    tresorerieParMois,
    derniersDossiers,
    alertes,
  };
}

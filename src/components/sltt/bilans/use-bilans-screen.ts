"use client";

import { useMemo, useState } from "react";
import { useUiPrefs } from "@/lib/session/ui-prefs-store";
import { useStore } from "@/lib/store";
import { formatFCFA, formatDateShort, parseLocalDate } from "@/lib/format";
import { exportToExcel, printHTML, htmlEscape } from "@/lib/export";
import { resolvePrintHTMLBrand } from "@/lib/societe-brand";
import { filterByAnnexeAndPeriode, computeBenefice } from "@/lib/benefice";
import { sommeFacturesEncaissees } from "@/lib/client-stats";
import { useToast } from "@/hooks/use-toast";
import { useActiveAnnexe } from "@/hooks/use-active-annexe";
import { useBeneficeParSociete } from "@/hooks/use-benefice-par-societe";
import { filterBySociete } from "@/lib/filter-by-societe";
import { CHART_COLORS } from "@/lib/constants";
import { currentYearMonth, getPeriodeLabel, type Periode, type SortDir, type SortKey } from "./shared";

export function useBilansScreen() {
  const { toast } = useToast();
  const [periode, setPeriode] = useState<Periode>("mensuel");
  const [mois, setMois] = useState(currentYearMonth);
  const [sortKey, setSortKey] = useState<SortKey>("reste");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const allEcritures = useStore((s) => s.ecritures);
  const clients = useStore((s) => s.clients);
  const societes = useStore((s) => s.societes);
  const factures = useStore((s) => s.factures);
  const depenses = useStore((s) => s.depenses);
  const contrats = useStore((s) => s.contrats);
  const selectedSocieteId = useUiPrefs((s) => s.selectedSocieteId);
  const { annexes, isMultiAnnexe } = useActiveAnnexe();

  // F1 : quand une société précise est sélectionnée, les écritures non
  // affectées (transit global) sont exclues des récaps/graphiques de cet écran.
  const ecritures = useMemo(
    () => filterBySociete(allEcritures, selectedSocieteId),
    [allEcritures, selectedSocieteId],
  );

  const periodeLabel = getPeriodeLabel(periode, mois);

  const filteredEcritures = useMemo(() => {
    const [year, month] = (mois || currentYearMonth()).split("-").map(Number);
    return ecritures.filter((e) => {
      const d = parseLocalDate(e.date);
      const eYear = d.getFullYear();
      const eMonth = d.getMonth() + 1;
      switch (periode) {
        case "mensuel":
          return eYear === year && eMonth === month;
        case "trimestriel":
          return eYear === year && Math.ceil(eMonth / 3) === Math.ceil(month / 3);
        case "semestriel":
          return eYear === year && (eMonth <= 6) === (month <= 6);
        case "annuel":
          return eYear === year;
        default:
          return true;
      }
    });
  }, [ecritures, mois, periode]);

  // F5 — Bénéfice sur le mois de référence sélectionné (indépendant de la
  // granularité "période" choisie, qui ne s'applique qu'au récap client).
  // Calcul partagé avec comptabilite.tsx / dashboard.tsx (useBeneficeParSociete) —
  // ne pas le réimplémenter ici.
  const anchorDate = useMemo(() => {
    const [year, month] = (mois || currentYearMonth()).split("-").map(Number);
    return new Date(year, month - 1);
  }, [mois]);
  const { consolide, parSociete, ecrituresAvecDate, caisseAvecDate } = useBeneficeParSociete(anchorDate);

  // F-ANNEXE — reporting consolidé par annexe, réservé aux utilisateurs
  // multi-annexes (RLS les laisse déjà voir les données des deux annexes ;
  // ce bloc n'est qu'un regroupement client-side, aucun contournement RLS).
  // Les dépenses de contrats n'ont pas de annexe_id propre (héritée du
  // contrat parent, cf. RLS 20260817) — on la dénormalise ici comme le fait
  // déjà useBeneficeParSociete pour societeId.
  const depensesAvecDateEtAnnexe = useMemo(
    () =>
      depenses.map((d) => ({
        ...d,
        date: d.dateDepense,
        annexeId: contrats.find((c) => c.id === d.contratId)?.annexeId,
      })),
    [depenses, contrats],
  );

  const beneficeAnnexe = useMemo(() => {
    const [year, month] = (mois || currentYearMonth()).split("-").map(Number);
    const m = month - 1;
    const computeFor = (annexeId: string | null) => {
      const recettes =
        filterByAnnexeAndPeriode(ecrituresAvecDate, annexeId, year, m).reduce((sum, e) => sum + e.montantPaye, 0) +
        sommeFacturesEncaissees(filterByAnnexeAndPeriode(factures, annexeId, year, m));
      const depensesMois =
        filterByAnnexeAndPeriode(caisseAvecDate, annexeId, year, m).reduce((sum, d) => sum + d.montant, 0) +
        filterByAnnexeAndPeriode(
          depensesAvecDateEtAnnexe.filter((d): d is typeof d & { annexeId: string } => !!d.annexeId),
          annexeId,
          year,
          m,
        ).reduce((sum, d) => sum + d.montant, 0);
      return { recettes, depenses: depensesMois, benefice: computeBenefice(recettes, depensesMois) };
    };
    return {
      consolide: computeFor(null),
      parAnnexe: annexes.map((a) => ({ annexe: a, ...computeFor(a.id) })),
    };
  }, [ecrituresAvecDate, factures, caisseAvecDate, depensesAvecDateEtAnnexe, annexes, mois]);

  // Le calcul ci-dessus porte toujours sur un seul mois de référence, quelle
  // que soit la granularité "période" choisie (voir commentaire F5 plus haut)
  // — le libellé doit donc toujours nommer ce mois, jamais l'année ou le
  // trimestre sélectionné, sous peine de laisser croire à un chiffre agrégé.
  const beneficeMoisLabel = useMemo(() => {
    const [year, month] = (mois || currentYearMonth()).split("-").map(Number);
    return new Date(year, month - 1).toLocaleString("fr-FR", { month: "long", year: "numeric" });
  }, [mois]);

  const chartData = useMemo(() => {
    const [year] = (mois || currentYearMonth()).split("-").map(Number);
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const monthEcritures = ecritures.filter((e) => {
        const d = parseLocalDate(e.date);
        return d.getFullYear() === year && d.getMonth() + 1 === m;
      });
      return {
        periode: new Date(year, i).toLocaleString("fr-FR", { month: "short" }),
        investi: monthEcritures.reduce((s, e) => s + e.montantInvesti, 0),
        encaisse: monthEcritures.reduce((s, e) => s + e.montantPaye, 0),
      };
    });
  }, [ecritures, mois]);

  const recapParClient = useMemo(() => {
    return clients
      .map((c) => {
        const clientEcritures = filteredEcritures.filter((e) => e.clientId === c.id);
        const investi = clientEcritures.reduce((s, e) => s + e.montantInvesti, 0);
        const encaisse = clientEcritures.reduce((s, e) => s + e.montantPaye, 0);
        const reste = Math.max(0, investi - encaisse);
        const ecart = encaisse - investi;
        return { client: c.nom, investi, encaisse, reste, ecart };
      })
      .filter((r) => r.investi > 0 || r.encaisse > 0);
  }, [clients, filteredEcritures]);

  const recapTotaux = useMemo(
    () =>
      recapParClient.reduce(
        (acc, r) => {
          acc.investi += r.investi;
          acc.encaisse += r.encaisse;
          acc.reste += r.reste;
          acc.ecart += r.ecart;
          return acc;
        },
        { investi: 0, encaisse: 0, reste: 0, ecart: 0 },
      ),
    [recapParClient],
  );

  const tauxRecouvrement =
    recapTotaux.investi > 0
      ? Math.round((recapTotaux.encaisse / recapTotaux.investi) * 100)
      : 0;

  const sortedRecap = useMemo(() => {
    const mult = sortDir === "asc" ? 1 : -1;
    return [...recapParClient].sort((a, b) => {
      if (sortKey === "client") return mult * a.client.localeCompare(b.client, "fr");
      return mult * (a[sortKey] - b[sortKey]);
    });
  }, [recapParClient, sortKey, sortDir]);

  const pieData = [
    { name: "Encaissé", value: recapTotaux.encaisse, color: CHART_COLORS.emerald },
    { name: "Reste à payer", value: recapTotaux.reste, color: CHART_COLORS.amber },
  ];
  const pieTotal = recapTotaux.encaisse + recapTotaux.reste;
  const hasData = recapParClient.length > 0;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "client" ? "asc" : "desc");
    }
  }

  async function handleExportExcel() {
    if (sortedRecap.length === 0) {
      toast({
        title: "Rien à exporter",
        description: "Aucune écriture pour la période sélectionnée.",
        variant: "destructive",
      });
      return;
    }
    try {
      await exportToExcel(
        "bilans",
        `bilans-${periode}-${mois}`,
        [
          { header: "Client", accessor: (r) => r.client },
          { header: "Investi (FCFA)", accessor: (r) => r.investi },
          { header: "Encaissé (FCFA)", accessor: (r) => r.encaisse },
          { header: "Reste à payer (FCFA)", accessor: (r) => r.reste },
          { header: "Écart de règlement (FCFA)", accessor: (r) => r.ecart },
        ],
        sortedRecap,
        { module: "Comptabilité" },
      );
    } catch {
      return;
    }
    toast({
      title: "Export Excel généré",
      description: `${sortedRecap.length} client${sortedRecap.length !== 1 ? "s" : ""} exportés — ${periodeLabel}.`,
    });
  }

  function handleExportPDF() {
    const rowsHTML = sortedRecap
      .map(
        (r) => `<tr>
          <td>${htmlEscape(r.client)}</td>
          <td class="num">${formatFCFA(r.investi, false)}</td>
          <td class="num">${formatFCFA(r.encaisse, false)}</td>
          <td class="num">${formatFCFA(r.reste, false)}</td>
          <td class="num">${r.ecart.toLocaleString("fr-FR")}</td>
        </tr>`,
      )
      .join("");
    printHTML(`Bilan ${periodeLabel}`, `
      <h1>Bilan financier — ${periodeLabel}</h1>
      <div class="subtitle">Taux de recouvrement : ${tauxRecouvrement}% · Édité le ${formatDateShort(new Date())}</div>
      <table>
        <thead><tr>
          <th>Client</th><th class="num">Investi</th><th class="num">Encaissé</th>
          <th class="num">Reste à payer</th><th class="num">Écart de règlement</th>
        </tr></thead>
        <tbody>${rowsHTML}</tbody>
        <tfoot><tr class="total-row">
          <td>Total</td>
          <td class="num">${formatFCFA(recapTotaux.investi, false)}</td>
          <td class="num">${formatFCFA(recapTotaux.encaisse, false)}</td>
          <td class="num">${formatFCFA(recapTotaux.reste, false)}</td>
          <td class="num">${recapTotaux.ecart.toLocaleString("fr-FR")}</td>
        </tr></tfoot>
      </table>
    `, resolvePrintHTMLBrand(societes));
  }

  return {
    periode,
    setPeriode,
    mois,
    setMois,
    periodeLabel,
    sortKey,
    sortDir,
    toggleSort,
    nbSocietes: societes.length,
    consolide,
    parSociete,
    isMultiAnnexe,
    beneficeAnnexe,
    beneficeMoisLabel,
    chartData,
    recapParClient,
    recapTotaux,
    tauxRecouvrement,
    sortedRecap,
    pieData,
    pieTotal,
    hasData,
    handleExportExcel,
    handleExportPDF,
  };
}

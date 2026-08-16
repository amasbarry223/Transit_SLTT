"use client";

import { useMemo, useState } from "react";
import { useUiPrefs } from "@/lib/session/ui-prefs-store";
import { useStore } from "@/lib/store";
import {
  calculerEcart,
  resteAPayer,
  type DossierStatut,
  type Dossier,
} from "@/lib/domain-types";
import { formatDateShort, formatFCFA, parseLocalDate } from "@/lib/format";
import { matchesQuery } from "@/lib/search-filter";
import { getDashboardAnchorDate } from "@/lib/calendar-anchor";
import { exportToExcel, printHTML, htmlEscape } from "@/lib/export";
import { resolvePrintHTMLBrand } from "@/lib/societe-brand";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";
import { useActiveAnnexe } from "@/hooks/use-active-annexe";

export const PAGE_SIZE = 8;

export const STATUT_OPTIONS: (DossierStatut | "Tous")[] = [
  "Tous",
  "En cours",
  "Dédouané",
  "Livré",
  "Soldé",
];

export type SortKey =
  | "date-desc"
  | "date-asc"
  | "reference"
  | "client"
  | "montant-desc"
  | "montant-asc"
  | "statut"
  | "ecart-desc";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date-desc", label: "Date (récent d'abord)" },
  { value: "date-asc", label: "Date (ancien d'abord)" },
  { value: "reference", label: "Référence A → Z" },
  { value: "client", label: "Client A → Z" },
  { value: "montant-desc", label: "Prestation (décroissante)" },
  { value: "montant-asc", label: "Prestation (croissante)" },
  { value: "statut", label: "Statut" },
  { value: "ecart-desc", label: "Marge (décroissante)" },
];

export function useDossiersListScreen() {
  const { selectedSocieteId } = useUiPrefs();
  const { selectedAnnexeId } = useActiveAnnexe();
  const { toast } = useToast();
  const dossiers = useStore((s) => s.dossiers);
  const clients = useStore((s) => s.clients);
  const societes = useStore((s) => s.societes);

  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("Tous");
  const [nonSoldeOnly, setNonSoldeOnly] = useState(false);
  const [periode, setPeriode] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("date-desc");
  const [page, setPage] = useState(1);
  const [transitionDossier, setTransitionDossier] = useState<Dossier | null>(null);

  const refDate = getDashboardAnchorDate();

  const availableYears = useMemo(() => {
    const years = new Set(dossiers.map((d) => d.date.slice(0, 4)).filter(Boolean));
    return [...years].sort().reverse();
  }, [dossiers]);

  const filtered = useMemo(() => {
    const list = dossiers.filter((d) => {
      if (selectedSocieteId && d.societeId !== selectedSocieteId) return false;
      if (selectedAnnexeId && d.annexeId !== selectedAnnexeId) return false;
      if (!matchesQuery(d, ["reference", "clientNom", "bl", "camion", "nature"], search)) return false;
      if (clientFilter !== "all" && d.clientId !== clientFilter) return false;
      if (statutFilter !== "Tous" && d.statut !== statutFilter) return false;
      if (nonSoldeOnly && resteAPayer(d) <= 0 && d.statut === "Soldé") return false;
      if (yearFilter !== "all" && d.date.slice(0, 4) !== yearFilter) return false;
      if (periode !== "all") {
        const dDate = parseLocalDate(d.date);
        const diffDays = (refDate.getTime() - dDate.getTime()) / (1000 * 60 * 60 * 24);
        if (periode === "month" && (diffDays > 31 || diffDays < 0)) return false;
        if (periode === "quarter" && (diffDays > 92 || diffDays < 0)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return b.date.localeCompare(a.date);
        case "date-asc":
          return a.date.localeCompare(b.date);
        case "reference":
          return a.reference.localeCompare(b.reference);
        case "client":
          return a.clientNom.localeCompare(b.clientNom, "fr");
        case "montant-desc":
          return b.fraisPrestation - a.fraisPrestation;
        case "montant-asc":
          return a.fraisPrestation - b.fraisPrestation;
        case "statut":
          return a.statut.localeCompare(b.statut);
        case "ecart-desc":
          return calculerEcart(b) - calculerEcart(a);
        default:
          return 0;
      }
    });
  }, [
    dossiers,
    selectedSocieteId,
    selectedAnnexeId,
    search,
    clientFilter,
    statutFilter,
    nonSoldeOnly,
    periode,
    yearFilter,
    sortBy,
    refDate,
  ]);

  const stats = useMemo(() => {
    let enCours = 0;
    let soldes = 0;
    let ecartTotal = 0;
    for (const d of filtered) {
      if (d.statut === "En cours") enCours++;
      if (d.statut === "Soldé") soldes++;
      ecartTotal += calculerEcart(d);
    }
    return { total: filtered.length, enCours, soldes, ecartTotal };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * PAGE_SIZE, filtered.length);

  const activeFiltersCount = [
    search.trim() !== "",
    clientFilter !== "all",
    statutFilter !== "Tous",
    nonSoldeOnly,
    periode !== "all",
    yearFilter !== "all",
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;

  function clearFilters() {
    setSearch("");
    setClientFilter("all");
    setStatutFilter("Tous");
    setNonSoldeOnly(false);
    setPeriode("all");
    setYearFilter("all");
    setSortBy("date-desc");
    setPage(1);
  }

  async function handleExportExcel() {
    if (filtered.length === 0) {
      toastWarning(toast, {
        title: "Rien à exporter",
        description: UI.errors.exportEmpty,
      });
      return;
    }
    try {
      await exportToExcel(
        "dossiers",
        `dossiers-transit-${new Date().toISOString().slice(0, 10)}`,
        [
          { header: "Référence", accessor: (d) => d.reference },
          { header: "Société", accessor: (d) => d.societeNom },
          { header: "Client", accessor: (d) => d.clientNom },
          { header: "N° BL", accessor: (d) => d.bl },
          { header: "N° camion", accessor: (d) => d.camion },
          { header: "Nature marchandise", accessor: (d) => d.nature },
          { header: "Droit de douane (FCFA)", accessor: (d) => d.droitDouane },
          { header: "Frais circuit (FCFA)", accessor: (d) => d.fraisCircuit },
          { header: "Frais prestation (FCFA)", accessor: (d) => d.fraisPrestation },
          { header: "Montant investi (FCFA)", accessor: (d) => d.montantInvesti },
          { header: "Montant payé (FCFA)", accessor: (d) => d.montantPaye },
          {
            header: "Reste à payer (FCFA)",
            accessor: (d) => resteAPayer(d),
          },
          { header: "Marge (FCFA)", accessor: (d) => calculerEcart(d) },
          { header: "Statut", accessor: (d) => d.statut },
          { header: "Date", accessor: (d) => formatDateShort(d.date) },
        ],
        filtered,
        { module: "Dossiers" },
      );
    } catch (error) {
      toastError(toast, error, {
        title: "Impossible de générer l'export Excel",
        fallback: UI.errors.exportFailed,
      });
      return;
    }
    toastSuccess(toast, {
      title: "Export Excel généré",
      description: `${filtered.length} dossiers exportés.`,
    });
  }

  function handleExportPDF() {
    const rowsHTML = filtered
      .map(
        (d) => `<tr>
          <td>${htmlEscape(d.reference)}</td>
          <td>${htmlEscape(d.clientNom)}</td>
          <td>${htmlEscape(d.bl)}</td>
          <td>${htmlEscape(d.camion)}</td>
          <td>${htmlEscape(d.nature)}</td>
          <td class="num">${formatFCFA(d.fraisPrestation, false)}</td>
          <td class="num">${calculerEcart(d).toLocaleString("fr-FR")}</td>
          <td><span class="badge" style="background:#dfeefa;color:#155a93">${htmlEscape(d.statut)}</span></td>
        </tr>`,
      )
      .join("");
    printHTML(
      "Liste des dossiers de transit",
      `
      <h1>Dossiers de transit</h1>
      <div class="subtitle">${filtered.length} dossier(s) · ${formatDateShort(new Date())}</div>
      <table>
        <thead><tr>
          <th>Référence</th><th>Client</th><th>N° BL</th><th>Camion</th>
          <th>Nature</th><th class="num">Prestation</th><th class="num">Marge</th><th>Statut</th>
        </tr></thead>
        <tbody>${rowsHTML}</tbody>
      </table>
    `,
      resolvePrintHTMLBrand(societes),
    );
  }

  return {
    clients,
    search,
    setSearch,
    clientFilter,
    setClientFilter,
    statutFilter,
    setStatutFilter,
    nonSoldeOnly,
    setNonSoldeOnly,
    periode,
    setPeriode,
    yearFilter,
    setYearFilter,
    sortBy,
    setSortBy,
    page,
    setPage,
    transitionDossier,
    setTransitionDossier,
    availableYears,
    filtered,
    stats,
    paged,
    startIdx,
    endIdx,
    totalPages,
    safePage,
    activeFiltersCount,
    hasActiveFilters,
    clearFilters,
    handleExportExcel,
    handleExportPDF,
  };
}

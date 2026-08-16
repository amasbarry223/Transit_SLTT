"use client";

import { useMemo, useState } from "react";
import { useStore, type Transporteur, type TransporteurStatut } from "@/lib/store";
import { formatDateShort } from "@/lib/format";
import { exportToExcel, printHTML, htmlEscape } from "@/lib/export";
import { resolvePrintHTMLBrand } from "@/lib/societe-brand";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";
import { usePermission } from "@/hooks/use-permission";
import { useActiveAnnexe } from "@/hooks/use-active-annexe";
import { filterByAnnexe } from "@/lib/filter-by-annexe";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import { matchesQuery } from "@/lib/search-filter";

export const PAGE_SIZE = 8;

export type SortKey =
  | "date-desc"
  | "date-asc"
  | "nom"
  | "trajet"
  | "capacite-desc"
  | "capacite-asc"
  | "statut";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date-desc", label: "Date d'ajout (récent)" },
  { value: "date-asc", label: "Date d'ajout (ancien)" },
  { value: "nom", label: "Nom A → Z" },
  { value: "trajet", label: "Trajet A → Z" },
  { value: "capacite-desc", label: "Capacité (décroissante)" },
  { value: "capacite-asc", label: "Capacité (croissante)" },
  { value: "statut", label: "Statut" },
];

export type InlineFormState = { mode: "add" | "edit"; target?: Transporteur } | null;

export function useTransporteursScreen() {
  const { toast } = useToast();
  const canWrite = usePermission("transporteurs:write");
  const allTransporteurs = useStore((s) => s.transporteurs);
  const societes = useStore((s) => s.societes);
  const updateTransporteurStatut = useStore((s) => s.updateTransporteurStatut);
  const removeTransporteur = useStore((s) => s.removeTransporteur);
  const { selectedAnnexeId } = useActiveAnnexe();

  const transporteurs = useMemo(
    () => filterByAnnexe(allTransporteurs, selectedAnnexeId),
    [allTransporteurs, selectedAnnexeId],
  );

  const [search, setSearch] = useState("");
  const [vehiculeFilter, setVehiculeFilter] = useState("all");
  const [statutFilter, setStatutFilter] = useState("Tous");
  const [sortBy, setSortBy] = useState<SortKey>("date-desc");
  const [page, setPage] = useState(1);

  const [inlineForm, setInlineForm] = useState<InlineFormState>(null);

  const {
    target: deleteTarget,
    setTarget: setDeleteTarget,
    confirm: confirmDeleteTransporteur,
  } = useDeleteConfirm<Transporteur>(
    removeTransporteur,
    (t) => t.id,
    (t) => t.nom,
    "Transporteur supprimé",
    "Impossible de supprimer le transporteur",
  );

  const [deactivateTarget, setDeactivateTarget] = useState<Transporteur | null>(null);

  const kpis = useMemo(() => {
    let actifs = 0;
    let inactifs = 0;
    let capaciteTotal = 0;
    for (const t of transporteurs) {
      if (t.statut === "Actif") {
        actifs++;
        capaciteTotal += t.capacite;
      } else {
        inactifs++;
      }
    }
    return { actifs, inactifs, capaciteTotal };
  }, [transporteurs]);

  const filtered = useMemo(() => {
    const list = transporteurs.filter((t) => {
      if (!matchesQuery(t, ["nom", "contact", "trajet", "immatriculation"], search)) return false;
      if (vehiculeFilter !== "all" && t.vehicule !== vehiculeFilter) return false;
      if (statutFilter !== "Tous" && t.statut !== statutFilter) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return b.dateCreation.localeCompare(a.dateCreation);
        case "date-asc":
          return a.dateCreation.localeCompare(b.dateCreation);
        case "nom":
          return a.nom.localeCompare(b.nom, "fr");
        case "trajet":
          return a.trajet.localeCompare(b.trajet, "fr");
        case "capacite-desc":
          return b.capacite - a.capacite;
        case "capacite-asc":
          return a.capacite - b.capacite;
        case "statut":
          return a.statut.localeCompare(b.statut);
        default:
          return 0;
      }
    });
  }, [transporteurs, search, vehiculeFilter, statutFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * PAGE_SIZE, filtered.length);

  const activeFiltersCount = [search.trim() !== "", vehiculeFilter !== "all", statutFilter !== "Tous"].filter(
    Boolean,
  ).length;
  const hasActiveFilters = activeFiltersCount > 0;

  const clearFilters = () => {
    setSearch("");
    setVehiculeFilter("all");
    setStatutFilter("Tous");
    setSortBy("date-desc");
    setPage(1);
  };

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const changeVehiculeFilter = (value: string) => {
    setVehiculeFilter(value);
    setPage(1);
  };

  const changeStatutFilter = (value: string) => {
    setStatutFilter(value);
    setPage(1);
  };

  const changeSortBy = (value: SortKey) => {
    setSortBy(value);
    setPage(1);
  };

  const openAddForm = () => {
    setInlineForm({ mode: "add" });
    setDeleteTarget(null);
  };

  const openEditForm = (target: Transporteur) => {
    setInlineForm({ mode: "edit", target });
    setDeleteTarget(null);
  };

  const closeForm = () => setInlineForm(null);

  const openDelete = (target: Transporteur) => {
    setDeleteTarget(target);
    setInlineForm(null);
  };

  const handleToggleStatut = async (t: Transporteur) => {
    const next: TransporteurStatut = t.statut === "Actif" ? "Inactif" : "Actif";
    if (next === "Inactif") {
      setDeactivateTarget(t);
      return;
    }
    try {
      await updateTransporteurStatut(t.id, next);
      toastSuccess(toast, { title: "Transporteur activé", description: t.nom });
    } catch (e) {
      toastError(toast, e, {
        title: "Impossible de modifier le statut",
        fallback: "Impossible de modifier le statut du transporteur.",
      });
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await updateTransporteurStatut(deactivateTarget.id, "Inactif");
      toastSuccess(toast, { title: "Transporteur désactivé", description: deactivateTarget.nom });
    } catch (e) {
      toastError(toast, e, {
        title: "Impossible de modifier le statut",
        fallback: "Impossible de modifier le statut du transporteur.",
      });
    }
    setDeactivateTarget(null);
  };

  const handleExportExcel = async () => {
    if (filtered.length === 0) {
      toastWarning(toast, {
        title: "Rien à exporter",
        description: UI.errors.exportEmpty,
      });
      return;
    }
    try {
      await exportToExcel(
        "transporteurs",
        `transporteurs-sltt-${new Date().toISOString().slice(0, 10)}`,
        [
          { header: "Société", accessor: (t: Transporteur) => t.nom },
          { header: "Contact", accessor: (t: Transporteur) => t.contact },
          { header: "Téléphone", accessor: (t: Transporteur) => t.telephone },
          { header: "Email", accessor: (t: Transporteur) => t.email ?? "" },
          { header: "Véhicule", accessor: (t: Transporteur) => t.vehicule },
          { header: "Immatriculation", accessor: (t: Transporteur) => t.immatriculation },
          { header: "Trajet", accessor: (t: Transporteur) => t.trajet },
          { header: "Capacité (t)", accessor: (t: Transporteur) => t.capacite },
          { header: "Statut", accessor: (t: Transporteur) => t.statut },
          { header: "Date ajout", accessor: (t: Transporteur) => formatDateShort(t.dateCreation) },
        ],
        filtered,
        { module: "Transporteurs" },
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
      description: `${filtered.length} transporteur${filtered.length !== 1 ? "s" : ""} exporté${filtered.length !== 1 ? "s" : ""}.`,
    });
  };

  const handleExportPDF = () => {
    const rowsHTML = filtered
      .map(
        (t) => `
      <tr>
        <td>${htmlEscape(t.nom)}</td>
        <td>${htmlEscape(t.contact)}<br><small>${htmlEscape(t.telephone)}</small></td>
        <td>${htmlEscape(t.vehicule)}<br><small style="font-family:monospace">${htmlEscape(t.immatriculation)}</small></td>
        <td>${htmlEscape(t.trajet)}</td>
        <td class="num">${t.capacite} t</td>
        <td><span class="badge" style="${t.statut === "Actif" ? "background:#d3f8e1;color:#0f5629" : "background:#f3f5f7;color:#6b7280"}">${htmlEscape(t.statut)}</span></td>
      </tr>`,
      )
      .join("");
    printHTML(
      "Liste des transporteurs",
      `
      <h1>Transporteurs partenaires</h1>
      <div class="subtitle">${filtered.length} transporteur(s) · ${formatDateShort(new Date())}</div>
      <table>
        <thead><tr>
          <th>Société</th><th>Contact</th><th>Véhicule</th>
          <th>Trajet</th><th class="num">Capacité</th><th>Statut</th>
        </tr></thead>
        <tbody>${rowsHTML}</tbody>
      </table>`,
      resolvePrintHTMLBrand(societes),
    );
  };

  return {
    canWrite,
    kpis,
    search,
    changeSearch,
    vehiculeFilter,
    changeVehiculeFilter,
    statutFilter,
    changeStatutFilter,
    sortBy,
    changeSortBy,
    page: safePage,
    setPage,
    filtered,
    paged,
    startIdx,
    endIdx,
    totalPages,
    activeFiltersCount,
    hasActiveFilters,
    clearFilters,
    inlineForm,
    openAddForm,
    openEditForm,
    closeForm,
    openDelete,
    deleteTarget,
    setDeleteTarget,
    confirmDeleteTransporteur,
    deactivateTarget,
    setDeactivateTarget,
    confirmDeactivate,
    handleToggleStatut,
    handleExportExcel,
    handleExportPDF,
  };
}

"use client";

import { useCallback, useMemo, useState } from "react";
import { usePagination } from "@/shared/hooks/use-pagination";
import {
  Handshake,
  Banknote,
  Link2,
} from "lucide-react";
import {
  useStore,
  type Fournisseur,
  type FournisseurType,
} from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import { usePermission } from "@/shared/hooks/use-permission";
import { useActiveAnnexe } from "@/shared/hooks/use-active-annexe";
import { filterByAnnexe } from "@/lib/filter-by-annexe";
import { useDeleteConfirm } from "@/shared/hooks/use-delete-confirm";
import { matchesQuery } from "@/lib/search-filter";
import { exportToExcel, printFournisseurs } from "@/lib/export";
import { resolveSlttBrand } from "@/lib/societe-brand";
import { useToast } from "@/shared/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/shared/utils/toast-helpers";
import { UI } from "@/shared/utils/ui-messages";
import type { FilterChip } from "@/components/sltt/list-filters";
import type { MetaTabItem } from "@/components/sltt/meta-tabs-list";
import { TYPES, TYPE_META } from "./fournisseur-type-meta";
import type { LiaisonEnrichie } from "./fournisseurs-table";

export type FournisseurTab = "prestataires" | "tarifs" | "couts";

const PAGE_SIZE = 8;

export const TAB_META: (MetaTabItem<FournisseurTab> & { description: string })[] = [
  {
    key: "prestataires",
    label: "Prestataires",
    shortLabel: "Prestataires",
    description: "Annuaire des prestataires externes et contacts opérationnels.",
    icon: Handshake,
    iconWrap:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 group-data-[state=inactive]:bg-slate-200/70 group-data-[state=inactive]:text-slate-500 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-400",
    badge:
      "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 group-data-[state=inactive]:bg-slate-200/80 group-data-[state=inactive]:text-slate-600 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-300",
  },
  {
    key: "tarifs",
    label: "Tarifs",
    shortLabel: "Tarifs",
    description: "Tarifs contractuels et montants cumulés par prestataire.",
    icon: Banknote,
    iconWrap:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 group-data-[state=inactive]:bg-slate-200/70 group-data-[state=inactive]:text-slate-500 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-400",
    badge:
      "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200 group-data-[state=inactive]:bg-slate-200/80 group-data-[state=inactive]:text-slate-600 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-300",
  },
  {
    key: "couts",
    label: "Suivi des coûts",
    shortLabel: "Coûts",
    description: "Liaisons dossiers — budget, réel et écarts de sous-traitance.",
    icon: Link2,
    iconWrap:
      "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 group-data-[state=inactive]:bg-slate-200/70 group-data-[state=inactive]:text-slate-500 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-400",
    badge:
      "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 group-data-[state=inactive]:bg-slate-200/80 group-data-[state=inactive]:text-slate-600 dark:group-data-[state=inactive]:bg-slate-700 dark:group-data-[state=inactive]:text-slate-300",
  },
];

export function useFournisseursScreen() {
  const { go } = useNav();
  const { toast } = useToast();
  const canWrite = usePermission("fournisseurs:write");
  const allFournisseurs = useStore((s) => s.fournisseurs);
  const dossierFournisseurs = useStore((s) => s.dossierFournisseurs);
  const dossiers = useStore((s) => s.dossiers);
  const societes = useStore((s) => s.societes);
  const removeFournisseur = useStore((s) => s.removeFournisseur);
  const { selectedAnnexeId } = useActiveAnnexe();

  const fournisseurs = useMemo(
    () => filterByAnnexe(allFournisseurs, selectedAnnexeId),
    [allFournisseurs, selectedAnnexeId],
  );

  const [activeTab, setActiveTab] = useState<FournisseurTab>("prestataires");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FournisseurType | null>(null);
  const [prestatairesPage, setPrestatairesPage] = useState(1);
  const [tarifsPage, setTarifsPage] = useState(1);
  const [coutsPage, setCoutsPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Fournisseur | undefined>();
  const { target: deleteTarget, setTarget: setDeleteTarget, confirm: handleDelete } = useDeleteConfirm<Fournisseur>(
    removeFournisseur,
    (f) => f.id,
    (f) => f.nom,
    "Fournisseur supprimé",
    "Impossible de supprimer le fournisseur.",
  );

  const filtered = useMemo(() => {
    return fournisseurs.filter((f) => {
      if (typeFilter && f.type !== typeFilter) return false;
      if (!matchesQuery(f, ["nom", "contact", "type"], search)) return false;
      return true;
    });
  }, [fournisseurs, search, typeFilter]);

  const tarifsSorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const at = a.tarifContractuel ?? -1;
        const bt = b.tarifContractuel ?? -1;
        if (bt !== at) return bt - at;
        return b.montantTotal - a.montantTotal;
      }),
    [filtered],
  );

  const liaisonsEnrichies = useMemo((): LiaisonEnrichie[] => {
    return dossierFournisseurs
      .filter((df) => {
        if (typeFilter && df.type !== typeFilter) return false;
        if (!matchesQuery(df, ["fournisseurNom", "dossierRef", "description"], search)) return false;
        return true;
      })
      .map((df) => ({
        ...df,
        dossier: dossiers.find((d) => d.id === df.dossierId),
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [dossierFournisseurs, dossiers, search, typeFilter]);

  const prestatairesPagination = usePagination(filtered, prestatairesPage, PAGE_SIZE);
  const tarifsPagination = usePagination(tarifsSorted, tarifsPage, PAGE_SIZE);
  const coutsPagination = usePagination(liaisonsEnrichies, coutsPage, PAGE_SIZE);

  const totalMontant = useMemo(
    () => liaisonsEnrichies.reduce((s, df) => s + df.montantReel, 0),
    [liaisonsEnrichies],
  );
  const totalBudgete = useMemo(
    () => liaisonsEnrichies.reduce((s, df) => s + df.montantBudgete, 0),
    [liaisonsEnrichies],
  );
  const { actifs, avecTarif, nbTypes } = useMemo(() => {
    let actifs = 0;
    let avecTarif = 0;
    const types = new Set<string>();
    for (const f of fournisseurs) {
      if (f.statut === "Actif") actifs++;
      if (f.tarifContractuel != null) avecTarif++;
      types.add(f.type);
    }
    return { actifs, avecTarif, nbTypes: types.size };
  }, [fournisseurs]);
  const enAttente = useMemo(
    () => dossierFournisseurs.filter((df) => df.statut === "En attente").length,
    [dossierFournisseurs],
  );

  const counts: Record<FournisseurTab, number> = {
    prestataires: filtered.length,
    tarifs: tarifsSorted.length,
    couts: liaisonsEnrichies.length,
  };

  const currentMeta = TAB_META.find((t) => t.key === activeTab) ?? TAB_META[0];

  const chips: FilterChip[] = TYPES.map((t) => ({
    id: t,
    label: TYPE_META[t].short,
    active: typeFilter === t,
    onToggle: () => setTypeFilter((cur) => (cur === t ? null : t)),
  }));

  // Références stables : PrestataireRow/TarifRow/CoutRow (fournisseurs-table.tsx)
  // sont mémoïsées avec React.memo — sans useCallback ici, ces handlers seraient
  // recréés à chaque render de l'écran et casseraient le memo sur chaque ligne.
  const handleEdit = useCallback((f: Fournisseur) => {
    setEditing(f);
    setShowForm(true);
  }, []);

  function openCreateForm() {
    setEditing(undefined);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(undefined);
  }

  const handleDeleteRequest = useCallback(
    (id: string) => {
      setDeleteTarget(fournisseurs.find((f) => f.id === id) ?? null);
    },
    [fournisseurs, setDeleteTarget],
  );

  const openDossier = useCallback(
    (dossierId: string) => {
      go("dossier-detail", { id: dossierId });
    },
    [go],
  );

  function clearTypeFilter() {
    setTypeFilter(null);
  }

  const filterLabel = [
    typeFilter ? TYPE_META[typeFilter].short : "",
    search.trim() ? `"${search.trim()}"` : "",
  ].filter(Boolean).join(" · ");

  function handleExportPDF() {
    if (filtered.length === 0) {
      toastWarning(toast, { title: "Rien à exporter", description: UI.errors.exportEmpty });
      return;
    }
    printFournisseurs(
      filtered.map((f) => ({
        nom: f.nom,
        type: f.type,
        contact: f.contact,
        telephone: f.telephone,
        email: f.email,
        adresse: f.adresse,
        statut: f.statut,
      })),
      filterLabel ? `Filtre : ${filterLabel}` : undefined,
      resolveSlttBrand(societes),
    );
  }

  async function handleExportExcel() {
    if (filtered.length === 0) {
      toastWarning(toast, { title: "Rien à exporter", description: UI.errors.exportEmpty });
      return;
    }
    try {
      await exportToExcel(
        "fournisseurs",
        `fournisseurs-sltt-${new Date().toISOString().slice(0, 10)}`,
        [
          { header: "Nom", accessor: (f: Fournisseur) => f.nom },
          { header: "Type", accessor: (f: Fournisseur) => f.type },
          { header: "Contact", accessor: (f: Fournisseur) => f.contact },
          { header: "Téléphone", accessor: (f: Fournisseur) => f.telephone },
          { header: "E-mail", accessor: (f: Fournisseur) => f.email },
          { header: "Adresse", accessor: (f: Fournisseur) => f.adresse },
          {
            header: "Tarif contractuel (FCFA)",
            accessor: (f: Fournisseur) => (f.tarifContractuel != null ? f.tarifContractuel : ""),
          },
          { header: "Dossiers liés", accessor: (f: Fournisseur) => f.nbDossiers },
          { header: "Cumul dossiers (FCFA)", accessor: (f: Fournisseur) => f.montantTotal },
          { header: "Statut", accessor: (f: Fournisseur) => f.statut },
        ],
        filtered,
        { module: "Fournisseurs" },
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
      description: `${filtered.length} fournisseur${filtered.length !== 1 ? "s" : ""} exporté${filtered.length !== 1 ? "s" : ""}.`,
    });
  }

  return {
    canWrite,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    typeFilter,
    showForm,
    editing,
    deleteTarget,
    setDeleteTarget,
    handleDelete,
    filtered,
    tarifsSorted,
    liaisonsEnrichies,
    prestatairesPagination,
    tarifsPagination,
    coutsPagination,
    setPrestatairesPage,
    setTarifsPage,
    setCoutsPage,
    totalMontant,
    totalBudgete,
    actifs,
    avecTarif,
    nbTypes,
    enAttente,
    counts,
    currentMeta,
    chips,
    hasActiveFilters: Boolean(search.trim() || typeFilter),
    handleEdit,
    openCreateForm,
    closeForm,
    handleDeleteRequest,
    openDossier,
    clearTypeFilter,
    handleExportPDF,
    handleExportExcel,
  };
}

"use client";

import { useMemo, useState } from "react";
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
import { usePermission } from "@/hooks/use-permission";
import { useActiveAnnexe } from "@/hooks/use-active-annexe";
import { filterByAnnexe } from "@/lib/filter-by-annexe";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import { matchesQuery } from "@/lib/search-filter";
import type { FilterChip } from "@/components/sltt/list-filters";
import type { MetaTabItem } from "@/components/sltt/meta-tabs-list";
import { TYPES, TYPE_META } from "./fournisseur-type-meta";
import type { LiaisonEnrichie } from "./fournisseurs-table";

export type FournisseurTab = "prestataires" | "tarifs" | "couts";

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
  const canWrite = usePermission("fournisseurs:write");
  const allFournisseurs = useStore((s) => s.fournisseurs);
  const dossierFournisseurs = useStore((s) => s.dossierFournisseurs);
  const dossiers = useStore((s) => s.dossiers);
  const removeFournisseur = useStore((s) => s.removeFournisseur);
  const { selectedAnnexeId } = useActiveAnnexe();

  const fournisseurs = useMemo(
    () => filterByAnnexe(allFournisseurs, selectedAnnexeId),
    [allFournisseurs, selectedAnnexeId],
  );

  const [activeTab, setActiveTab] = useState<FournisseurTab>("prestataires");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FournisseurType | null>(null);
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

  const totalMontant = useMemo(
    () => liaisonsEnrichies.reduce((s, df) => s + df.montantReel, 0),
    [liaisonsEnrichies],
  );
  const totalBudgete = useMemo(
    () => liaisonsEnrichies.reduce((s, df) => s + df.montantBudgete, 0),
    [liaisonsEnrichies],
  );
  const { actifs, avecTarif } = useMemo(() => {
    let actifs = 0;
    let avecTarif = 0;
    for (const f of fournisseurs) {
      if (f.statut === "Actif") actifs++;
      if (f.tarifContractuel != null) avecTarif++;
    }
    return { actifs, avecTarif };
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

  function handleEdit(f: Fournisseur) {
    setEditing(f);
    setShowForm(true);
  }

  function openCreateForm() {
    setEditing(undefined);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(undefined);
  }

  function handleDeleteRequest(id: string) {
    setDeleteTarget(fournisseurs.find((f) => f.id === id) ?? null);
  }

  function openDossier(dossierId: string) {
    go("dossier-detail", { id: dossierId });
  }

  function clearTypeFilter() {
    setTypeFilter(null);
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
    totalMontant,
    totalBudgete,
    actifs,
    avecTarif,
    enAttente,
    counts,
    currentMeta,
    chips,
    handleEdit,
    openCreateForm,
    closeForm,
    handleDeleteRequest,
    openDossier,
    clearTypeFilter,
  };
}

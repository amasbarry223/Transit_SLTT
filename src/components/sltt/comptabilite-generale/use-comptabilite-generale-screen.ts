"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import type { OperationComptable, OperationComptableType } from "@/lib/domain-types";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import {
  computeOperationsTotals,
  computeRunningEcart,
  filterOperationsByEntite,
  filterOperationsByPeriode,
  resolveEntitesComptables,
} from "@/lib/comptabilite-generale";
import { usePermission } from "@/hooks/use-permission";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/export";
import { formatDateShort } from "@/lib/format";
import { PAGE_SIZE } from "./shared";

function entiteKeyOf(entite: { type: string; id: string }): string {
  return `${entite.type}:${entite.id}`;
}

export function useComptabiliteGeneraleScreen() {
  const { toast } = useToast();
  const canWrite = usePermission("comptabilite:write");
  const annexes = useStore((s) => s.annexes);
  const societes = useStore((s) => s.societes);
  const allOperations = useStore((s) => s.operationsComptables);
  const cloturesCaisse = useStore((s) => s.cloturesCaisse);
  const removeOperationComptable = useStore((s) => s.removeOperationComptable);
  const {
    target: deleteTarget,
    setTarget: setDeleteTarget,
    confirm: confirmDelete,
  } = useDeleteConfirm<OperationComptable>(
    removeOperationComptable,
    (o) => o.id,
    (o) => o.reference,
    "Opération supprimée",
    "Impossible de supprimer l'opération",
  );

  const entites = useMemo(() => resolveEntitesComptables(annexes, societes), [annexes, societes]);
  const [activeEntiteKey, setActiveEntiteKey] = useState<string | null>(null);
  const resolvedEntite = useMemo(() => {
    if (entites.length === 0) return null;
    const found = activeEntiteKey ? entites.find((e) => entiteKeyOf(e) === activeEntiteKey) : null;
    return found ?? entites[0];
  }, [entites, activeEntiteKey]);
  const resolvedTab = resolvedEntite ? entiteKeyOf(resolvedEntite) : "";

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | OperationComptableType>("all");
  const [scopeFilter, setScopeFilter] = useState<"tous" | "dossiers" | "generales">("tous");
  const [clientFilter, setClientFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const entiteOperations = useMemo(
    () => (resolvedEntite ? filterOperationsByEntite(allOperations, resolvedEntite) : []),
    [allOperations, resolvedEntite],
  );
  const clientOptions = useMemo(
    () => Array.from(new Set(entiteOperations.map((o) => o.clientNom))).sort((a, b) => a.localeCompare(b, "fr")),
    [entiteOperations],
  );
  // Retombe sur "tous les clients" si la valeur sélectionnée n'existe pas
  // pour l'entité active (ex. après un changement d'onglet) plutôt que
  // d'afficher silencieusement zéro résultat.
  const effectiveClientFilter = clientOptions.includes(clientFilter) ? clientFilter : "";
  const periodOperations = useMemo(
    () => filterOperationsByPeriode(entiteOperations, dateFrom || undefined, dateTo || undefined),
    [entiteOperations, dateFrom, dateTo],
  );
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return periodOperations.filter((o) => {
      if (typeFilter !== "all" && o.type !== typeFilter) return false;
      if (scopeFilter === "dossiers" && !o.dossierId) return false;
      if (scopeFilter === "generales" && !!o.dossierId) return false;
      if (effectiveClientFilter && o.clientNom !== effectiveClientFilter) return false;
      const dossierRef = o.dossierRef ? o.dossierRef.toLowerCase() : "";
      const haystack = `${o.clientNom} ${o.nature} ${o.reference} ${dossierRef}`.toLowerCase();
      return !normalizedQuery || haystack.includes(normalizedQuery);
    });
  }, [periodOperations, query, typeFilter, scopeFilter, effectiveClientFilter]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.date.localeCompare(a.date) || b.reference.localeCompare(a.reference)),
    [filtered],
  );

  const totals = useMemo(() => computeOperationsTotals(periodOperations), [periodOperations]);
  // Cumul sur TOUTES les opérations de l'entité (global et par client)
  const { ecartCumuleById, ecartClientCumuleById } = useMemo(() => {
    const mapGlobal = new Map<string, number>();
    const mapClient = new Map<string, number>();
    for (const { operation, ecartCumule, ecartClientCumule } of computeRunningEcart(entiteOperations)) {
      mapGlobal.set(operation.id, ecartCumule);
      mapClient.set(operation.id, ecartClientCumule);
    }
    return { ecartCumuleById: mapGlobal, ecartClientCumuleById: mapClient };
  }, [entiteOperations]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const startIdx = sorted.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * PAGE_SIZE, sorted.length);
  const hasActiveFilters =
    query.trim() !== "" || typeFilter !== "all" || effectiveClientFilter !== "" || dateFrom !== "" || dateTo !== "";

  // Vue consolidée groupe : totaux par entité (mêmes bornes de date que
  // l'écran), tous clients confondus — jamais de journal mélangé entre
  // entités, seulement leurs totaux côte à côte.
  const entiteTotals = useMemo(
    () =>
      entites.map((entite) => ({
        entite,
        totals: computeOperationsTotals(
          filterOperationsByPeriode(filterOperationsByEntite(allOperations, entite), dateFrom || undefined, dateTo || undefined),
        ),
      })),
    [entites, allOperations, dateFrom, dateTo],
  );

  const dernieresClotures = useMemo(
    () =>
      resolvedEntite
        ? cloturesCaisse
            .filter(
              (c) =>
                c.entiteType === resolvedEntite.type &&
                (resolvedEntite.type === "annexe" ? c.annexeId === resolvedEntite.id : c.societeId === resolvedEntite.id),
            )
            .sort((a, b) => b.periodeFin.localeCompare(a.periodeFin))
        : [],
    [cloturesCaisse, resolvedEntite],
  );

  function clearFilters() {
    setQuery("");
    setTypeFilter("all");
    setClientFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const [formOpen, setFormOpen] = useState(false);
  const [clotureOpen, setClotureOpen] = useState(false);

  async function exportExcel() {
    if (sorted.length === 0) {
      toast({ title: "Rien à exporter", description: "Aucune opération ne correspond aux filtres actuels.", variant: "destructive" });
      return;
    }
    try {
      await exportToExcel(
        "comptabilite-generale",
        `comptabilite-generale-${resolvedEntite?.label ?? "export"}-${new Date().toISOString().slice(0, 10)}`,
        [
          { header: "Date", accessor: (o) => formatDateShort(o.date) },
          { header: "Client / Tiers", accessor: (o) => o.clientNom },
          { header: "Nature", accessor: (o) => o.nature },
          { header: "Entrée (FCFA)", accessor: (o) => (o.type === "Entrée" ? o.montant : 0) },
          { header: "Sortie (FCFA)", accessor: (o) => (o.type === "Sortie" ? o.montant : 0) },
          { header: "Quantité", accessor: (o) => o.quantite ?? "" },
          { header: "Prix unitaire (FCFA)", accessor: (o) => o.prixUnitaire ?? "" },
          { header: "Référence", accessor: (o) => o.reference },
        ],
        sorted,
        { module: "Comptabilité" },
      );
    } catch {
      return;
    }
    toast({ title: "Export Excel généré", description: `${sorted.length} opération${sorted.length !== 1 ? "s" : ""} exportée${sorted.length !== 1 ? "s" : ""}.` });
  }

  return {
    canWrite,
    entites,
    resolvedEntite,
    resolvedTab,
    setActiveEntiteKey,
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    scopeFilter,
    setScopeFilter,
    clientOptions,
    clientFilter: effectiveClientFilter,
    setClientFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    page: safePage,
    setPage,
    paged,
    totalItems: sorted.length,
    totalPages,
    startIdx,
    endIdx,
    hasActiveFilters,
    clearFilters,
    totals,
    ecartCumuleById,
    ecartClientCumuleById,
    entiteTotals,
    dernieresClotures,
    formOpen,
    setFormOpen,
    clotureOpen,
    setClotureOpen,
    deleteTarget,
    setDeleteTarget,
    confirmDelete,
    exportExcel,
  };
}

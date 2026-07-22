"use client";

import { useMemo, useState } from "react";
import type { BonMotif, BonSortie } from "@/lib/domain-types";
import { matchesQuery } from "@/lib/search-filter";

export const BON_PAGE_SIZE = 8;

export const BON_MOTIFS: BonMotif[] = ["Vente", "Livraison", "Transfert"];

export const BON_MOTIF_TONE: Record<BonMotif, "blue" | "indigo" | "amber"> = {
  Vente: "blue",
  Livraison: "indigo",
  Transfert: "amber",
};

export const BON_STATUT_TONE: Record<"Validé" | "Brouillon", "emerald" | "slate"> = {
  Validé: "emerald",
  Brouillon: "slate",
};

export function useBonFilters(bons: BonSortie[]) {
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [motifFilter, setMotifFilter] = useState("all");
  const [statutFilter, setStatutFilter] = useState<"all" | "Validé" | "Brouillon">("all");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);

  const stats = useMemo(() => {
    let valides = 0;
    let brouillons = 0;
    let montantTotal = 0;
    for (const bon of bons) {
      if (bon.statut === "Validé") {
        valides++;
        montantTotal += bon.montant;
      } else {
        brouillons++;
      }
    }
    return { total: bons.length, valides, brouillons, montantTotal };
  }, [bons]);

  const filtered = useMemo(() => {
    return bons.filter((bon) => {
      if (!matchesQuery(bon, ["reference", "clientNom", "marchandise"], search)) return false;
      if (clientFilter !== "all" && bon.clientId !== clientFilter) return false;
      if (motifFilter !== "all" && bon.motif !== motifFilter) return false;
      if (statutFilter !== "all" && bon.statut !== statutFilter) return false;
      if (dateFilter && bon.date !== dateFilter) return false;
      return true;
    });
  }, [bons, search, clientFilter, motifFilter, statutFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / BON_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * BON_PAGE_SIZE, safePage * BON_PAGE_SIZE);
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * BON_PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * BON_PAGE_SIZE, filtered.length);

  const hasActiveFilters =
    search.trim() !== "" ||
    clientFilter !== "all" ||
    motifFilter !== "all" ||
    statutFilter !== "all" ||
    dateFilter !== "";

  function clearFilters() {
    setSearch("");
    setClientFilter("all");
    setMotifFilter("all");
    setStatutFilter("all");
    setDateFilter("");
    setPage(1);
  }

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateClientFilter(value: string) {
    setClientFilter(value);
    setPage(1);
  }

  function updateMotifFilter(value: string) {
    setMotifFilter(value);
    setPage(1);
  }

  function updateStatutFilter(value: "all" | "Validé" | "Brouillon") {
    setStatutFilter(value);
    setPage(1);
  }

  function updateDateFilter(value: string) {
    setDateFilter(value);
    setPage(1);
  }

  return {
    search,
    clientFilter,
    motifFilter,
    statutFilter,
    dateFilter,
    page: safePage,
    setPage,
    stats,
    filtered,
    paged,
    totalPages,
    startIdx,
    endIdx,
    hasActiveFilters,
    clearFilters,
    updateSearch,
    updateClientFilter,
    updateMotifFilter,
    updateStatutFilter,
    updateDateFilter,
  };
}

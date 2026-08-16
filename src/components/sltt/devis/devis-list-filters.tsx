"use client";

import { ArrowUpDown, FileSpreadsheet, FileText, Search } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { DevisStatut } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SocieteFilterSelect } from "@/components/sltt/societe-filter-select";

export type DevisSortKey = "date-desc" | "date-asc" | "reference" | "client" | "montant-desc" | "montant-asc" | "validite-asc" | "statut";

export const DEVIS_SORT_OPTIONS: { value: DevisSortKey; label: string }[] = [
  { value: "date-desc", label: "Date (récent d'abord)" },
  { value: "date-asc", label: "Date (ancien d'abord)" },
  { value: "reference", label: "Référence A → Z" },
  { value: "client", label: "Client A → Z" },
  { value: "montant-desc", label: "Montant (décroissant)" },
  { value: "montant-asc", label: "Montant (croissant)" },
  { value: "validite-asc", label: "Validité (proche d'abord)" },
  { value: "statut", label: "Statut" },
];

export function DevisListFilters({
  search, setSearch, clients, clientFilter, setClientFilter, statutFilter, setStatutFilter,
  sortBy, setSortBy, setPage, hasActiveFilters, activeFiltersCount, clearFilters,
  filteredCount, handleExportPDF, handleExportExcel,
}: {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  clients: { id: string; nom: string }[];
  clientFilter: string;
  setClientFilter: Dispatch<SetStateAction<string>>;
  statutFilter: DevisStatut | "Tous";
  setStatutFilter: Dispatch<SetStateAction<DevisStatut | "Tous">>;
  sortBy: DevisSortKey;
  setSortBy: Dispatch<SetStateAction<DevisSortKey>>;
  setPage: Dispatch<SetStateAction<number>>;
  hasActiveFilters: boolean;
  activeFiltersCount: number;
  clearFilters: () => void;
  filteredCount: number;
  handleExportPDF: () => void;
  handleExportExcel: () => void;
}) {
  const filtered = { length: filteredCount };
  const SORT_OPTIONS = DEVIS_SORT_OPTIONS;
  return (
      <Card className="border-border/80 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-9"
              placeholder="Référence, client, nature…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <Select value={clientFilter} onValueChange={(v) => { setClientFilter(v); setPage(1); }}>
            <SelectTrigger className="h-10 w-full sm:w-52">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les clients</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <SocieteFilterSelect className="h-10 w-full sm:w-52" />

          <Select value={statutFilter} onValueChange={(v) => { setStatutFilter(v as DevisStatut | "Tous"); setPage(1); }}>
            <SelectTrigger className="h-10 w-full sm:w-44">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tous">Tous les statuts</SelectItem>
              {(["Brouillon", "Envoyé", "Accepté", "Refusé", "Expiré"] as DevisStatut[]).map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => { setSortBy(v as DevisSortKey); setPage(1); }}>
            <SelectTrigger className="h-10 w-full sm:w-52">
              <ArrowUpDown className="size-3.5 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Trier par…" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-10 gap-1.5 text-muted-foreground" onClick={clearFilters}>
              Réinitialiser
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-foreground/90">
                {activeFiltersCount}
              </span>
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 shrink-0"
              onClick={handleExportPDF}
              disabled={filtered.length === 0}
              title="Exporter en PDF"
              aria-label="Exporter en PDF"
            >
              <FileText className="size-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 shrink-0"
              onClick={handleExportExcel}
              disabled={filtered.length === 0}
              title="Exporter en Excel"
              aria-label="Exporter en Excel"
            >
              <FileSpreadsheet className="size-4" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
          </div>
        </div>
      </Card>
  );
}

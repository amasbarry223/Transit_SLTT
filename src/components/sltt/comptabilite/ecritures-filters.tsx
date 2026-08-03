import { Search } from "lucide-react";
import type { Client } from "@/lib/domain-types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StatutFilter } from "./shared";

interface EcrituresFiltersProps {
  query: string;
  statutFilter: StatutFilter;
  clientFilter: string;
  clients: Client[];
  resultCount: number;
  hasActiveFilters: boolean;
  onQueryChange: (value: string) => void;
  onStatutChange: (value: StatutFilter) => void;
  onClientChange: (value: string) => void;
  onClear: () => void;
}

export function EcrituresFilters({
  query,
  statutFilter,
  clientFilter,
  clients,
  resultCount,
  hasActiveFilters,
  onQueryChange,
  onStatutChange,
  onClientChange,
  onClear,
}: EcrituresFiltersProps) {
  return (
    <Card className="border-border/80 p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Rechercher client, référence…"
            className="h-10 pl-9"
            aria-label="Rechercher une écriture"
          />
        </div>
        <Select value={statutFilter} onValueChange={(value) => onStatutChange(value as StatutFilter)}>
          <SelectTrigger className="h-10 w-full sm:w-44" aria-label="Filtrer par statut">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="En attente">En attente</SelectItem>
            <SelectItem value="Soldé">Soldé</SelectItem>
          </SelectContent>
        </Select>
        <Select value={clientFilter} onValueChange={onClientChange}>
          <SelectTrigger className="h-10 w-full sm:w-52" aria-label="Filtrer par client">
            <SelectValue placeholder="Client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>{client.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-10 text-slate-500 dark:text-slate-400" onClick={onClear}>
            Réinitialiser
          </Button>
        )}
        <p className="ml-auto text-xs tabular-nums text-slate-500 dark:text-slate-400">
          {resultCount} écriture{resultCount !== 1 ? "s" : ""}
        </p>
      </div>
    </Card>
  );
}

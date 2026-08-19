"use client";

import {
  Plus,
  Search,
  Printer,
  FileSpreadsheet,
  Pencil,
  Trash2,
  Truck,
  Phone,
  Mail,
  MapPin,
  ArrowUpDown,
  MoreHorizontal,
  PowerOff,
  Power,
} from "lucide-react";
import type { Transporteur } from "@/lib/store";
import { VEHICULES } from "@/components/sltt/transporteur-form-fields";
import { ActifStatutBadge } from "@/components/sltt/status-badge";
import { EmptyState } from "@/components/sltt/empty-state";
import { TablePagination } from "@/components/sltt/table-pagination";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS, type SortKey } from "./use-transporteurs-screen";

interface TransporteursTableProps {
  filtered: Transporteur[];
  paged: Transporteur[];
  canWrite: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  vehiculeFilter: string;
  onVehiculeFilterChange: (value: string) => void;
  statutFilter: string;
  onStatutFilterChange: (value: string) => void;
  sortBy: SortKey;
  onSortByChange: (value: SortKey) => void;
  hasActiveFilters: boolean;
  activeFiltersCount: number;
  onClearFilters: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  onAdd: () => void;
  onEdit: (transporteur: Transporteur) => void;
  onDelete: (transporteur: Transporteur) => void;
  onToggleStatut: (transporteur: Transporteur) => void;
  startIdx: number;
  endIdx: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function TransporteursTable({
  filtered,
  paged,
  canWrite,
  search,
  onSearchChange,
  vehiculeFilter,
  onVehiculeFilterChange,
  statutFilter,
  onStatutFilterChange,
  sortBy,
  onSortByChange,
  hasActiveFilters,
  activeFiltersCount,
  onClearFilters,
  onExportPDF,
  onExportExcel,
  onAdd,
  onEdit,
  onDelete,
  onToggleStatut,
  startIdx,
  endIdx,
  page,
  totalPages,
  onPageChange,
}: TransporteursTableProps) {
  return (
    <>
      <Card className="border-border/80 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-9"
              placeholder="Société, contact, trajet, immat…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <Select value={vehiculeFilter} onValueChange={onVehiculeFilterChange}>
            <SelectTrigger className="h-10 w-full sm:w-44">
              <SelectValue placeholder="Véhicule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les véhicules</SelectItem>
              {VEHICULES.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statutFilter} onValueChange={onStatutFilterChange}>
            <SelectTrigger className="h-10 w-full sm:w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tous">Tous les statuts</SelectItem>
              <SelectItem value="Actif">Actif</SelectItem>
              <SelectItem value="Inactif">Inactif</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => onSortByChange(v as SortKey)}>
            <SelectTrigger className="h-10 w-full sm:w-52">
              <ArrowUpDown className="size-3.5 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Trier par…" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 gap-1.5 text-muted-foreground"
              onClick={onClearFilters}
            >
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
              onClick={onExportPDF}
              disabled={filtered.length === 0}
              title="Imprimer la liste"
              aria-label="Imprimer la liste"
            >
              <Printer className="size-4" />
              <span className="hidden sm:inline">Imprimer la liste</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 shrink-0"
              onClick={onExportExcel}
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

      <Card className="gap-0 overflow-hidden border-border/80 p-0 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Truck className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Liste des transporteurs</h2>
          <span className="ml-auto text-xs tabular-nums text-muted-foreground">
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Aucun transporteur trouvé"
            description={
              hasActiveFilters
                ? "Modifiez vos filtres ou ajoutez un nouveau partenaire."
                : "Commencez par enregistrer votre premier transporteur partenaire."
            }
            action={
              !hasActiveFilters && canWrite ? (
                <Button onClick={onAdd}>
                  <Plus className="size-4" /> Nouveau transporteur
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {paged.map((t) => {
                const isInactif = t.statut === "Inactif";
                return (
                  <Card
                    key={t.id}
                    className={cn(
                      "border-border/80 p-4 shadow-sm",
                      canWrite && "cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/60",
                      isInactif && "opacity-80",
                    )}
                    onClick={canWrite ? () => onEdit(t) : undefined}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{t.nom}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{t.contact}</p>
                      </div>
                      <ActifStatutBadge statut={t.statut} />
                    </div>
                    <dl className="mt-3 space-y-1.5 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-muted-foreground">Véhicule</dt>
                        <dd className="text-right text-foreground/90">
                          {t.vehicule}{" "}
                          <span className="font-mono text-xs text-muted-foreground">{t.immatriculation}</span>
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-muted-foreground">Téléphone</dt>
                        <dd className="font-mono text-xs text-foreground/90">{t.telephone}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-muted-foreground">Trajet</dt>
                        <dd className="truncate text-right text-foreground/90">{t.trajet}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-xs text-muted-foreground">Capacité</dt>
                        <dd className="tabular-nums text-foreground/90">{t.capacite} t</dd>
                      </div>
                    </dl>
                    {canWrite && (
                      <div
                        className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="outline" size="sm" onClick={() => onToggleStatut(t)}>
                          {t.statut === "Actif" ? "Désactiver" : "Activer"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-primary"
                          title="Modifier"
                          onClick={() => onEdit(t)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          title="Supprimer"
                          onClick={() => onDelete(t)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/50 hover:bg-muted">
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Société / Contact
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                      Coordonnées
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Véhicule
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
                      Trajet
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">
                      Capacité
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Statut
                    </TableHead>
                    <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((t) => {
                    const isInactif = t.statut === "Inactif";
                    return (
                      <TableRow
                        key={t.id}
                        className={cn(
                          "cursor-pointer border-b border-border transition-colors hover:bg-muted/80",
                          isInactif && "bg-muted/40 opacity-80",
                          !canWrite && "cursor-default",
                        )}
                        onClick={canWrite ? () => onEdit(t) : undefined}
                      >
                        <TableCell className="px-4 py-3.5">
                          <p className="font-semibold text-foreground">{t.nom}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{t.contact}</p>
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 sm:table-cell">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="size-3 shrink-0 text-muted-foreground" /> {t.telephone}
                          </div>
                          {t.email && (
                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="size-3 shrink-0" /> {t.email}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <p className="text-sm font-medium text-foreground/90">{t.vehicule}</p>
                          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{t.immatriculation}</p>
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 md:table-cell">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="line-clamp-1">{t.trajet}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden px-4 py-3.5 text-right tabular-nums lg:table-cell">
                          <span className="font-medium text-foreground/90">{t.capacite} t</span>
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <div className="flex flex-col gap-1">
                            <ActifStatutBadge statut={t.statut} />
                            {canWrite && (
                              <button
                                className={cn(
                                  "inline-flex w-fit items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-colors hover:opacity-80",
                                  t.statut === "Actif"
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700",
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleStatut(t);
                                }}
                              >
                                {t.statut === "Actif" ? "→ Désactiver" : "→ Activer"}
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {canWrite && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-primary"
                                  title="Modifier"
                                  onClick={() => onEdit(t)}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-muted-foreground hover:text-primary"
                                    >
                                      <MoreHorizontal className="size-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => onToggleStatut(t)}>
                                      {t.statut === "Actif" ? (
                                        <>
                                          <PowerOff className="mr-2 size-3.5" /> Désactiver
                                        </>
                                      ) : (
                                        <>
                                          <Power className="mr-2 size-3.5 text-emerald-600 dark:text-emerald-400" /> Activer
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/40 focus:text-red-700"
                                      onClick={() => onDelete(t)}
                                    >
                                      <Trash2 className="mr-2 size-3.5" /> Supprimer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              startIdx={startIdx}
              endIdx={endIdx}
              totalItems={filtered.length}
              itemLabel={`transporteur${filtered.length !== 1 ? "s" : ""}`}
              page={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </>
        )}
      </Card>
    </>
  );
}

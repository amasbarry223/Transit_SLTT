"use client";

import { memo } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  Mail,
  MapPin,
  Pencil,
  Phone,
  UserPlus,
  Users,
} from "lucide-react";
import { DossierIcon } from "@/shared/components/icons/dossier-icon";
import type { Client } from "@/features/clients/types";
import { formatFCFA } from "@/lib/format";
import { cn, getInitials } from "@/shared/utils/cn";
import { UI } from "@/shared/utils/ui-messages";
import { EmptyState } from "@/components/sltt/empty-state";
import { SocieteBadge } from "@/components/sltt/societe-filter-select";
import { TablePagination } from "@/components/sltt/table-pagination";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClientTypeBadge } from "./client-type-badge";
import {
  avatarGradient,
  rowAccentClass,
  type ClientSortKey,
} from "./shared";

type ClientsTableProps = {
  paged: Client[];
  filteredCount: number;
  startIdx: number;
  endIdx: number;
  safePage: number;
  totalPages: number;
  hasActiveFilters: boolean;
  canWrite: boolean;
  sortBy: ClientSortKey;
  onSortChange: (key: ClientSortKey) => void;
  onPageChange: (page: number) => void;
  onOpenClient: (id: string) => void;
  onEditClient: (id: string, e: React.MouseEvent) => void;
  onCreateClient?: () => void;
};

function SortableHeader({
  label,
  sortKey,
  activeSort,
  align = "left",
  onSortChange,
}: {
  label: string;
  sortKey: ClientSortKey;
  activeSort: ClientSortKey;
  align?: "left" | "center" | "right";
  onSortChange: (key: ClientSortKey) => void;
}) {
  const isActive = activeSort === sortKey;
  const ariaSort = isActive
    ? sortKey === "nom"
      ? "ascending"
      : "descending"
    : "none";

  return (
    <TableHead
      className={cn(
        "h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground",
        align === "center" && "text-center",
        align === "right" && "text-right",
      )}
      aria-sort={ariaSort}
    >
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 rounded-md transition-colors hover:text-slate-700 dark:hover:text-slate-200",
          align === "center" && "mx-auto",
          align === "right" && "ml-auto",
          isActive && "text-slate-800 dark:text-slate-100",
        )}
        onClick={() => onSortChange(sortKey)}
      >
        {label}
        {isActive &&
          (sortKey === "nom" ? (
            <ArrowUp className="size-3.5 shrink-0" aria-hidden />
          ) : (
            <ArrowDown className="size-3.5 shrink-0" aria-hidden />
          ))}
      </button>
    </TableHead>
  );
}

const ClientMobileCard = memo(function ClientMobileCard({
  client,
  canWrite,
  onOpenClient,
  onEditClient,
}: {
  client: Client;
  canWrite: boolean;
  onOpenClient: (id: string) => void;
  onEditClient: (id: string, e: React.MouseEvent) => void;
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer border-border/80 p-4 shadow-sm active:bg-slate-50 dark:active:bg-slate-800/60",
        rowAccentClass(client.type),
      )}
      onClick={() => onOpenClient(client.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white",
              avatarGradient(client.type),
            )}
          >
            {getInitials(client.nom)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{client.nom}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <ClientTypeBadge type={client.type} size="sm" />
              <SocieteBadge societeNom={client.societeNom} societeId={client.societeId} size="sm" />
            </div>
          </div>
        </div>
        <div
          className="flex shrink-0 items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-primary"
            onClick={() => onOpenClient(client.id)}
            aria-label={`Voir la fiche de ${client.nom}`}
          >
            <Eye className="size-4" />
          </Button>
          {canWrite && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-primary"
              onClick={(e) => onEditClient(client.id, e)}
              aria-label={`Modifier ${client.nom}`}
            >
              <Pencil className="size-4" />
            </Button>
          )}
        </div>
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        {client.telephone && (
          <div className="flex justify-between gap-3">
            <dt className="text-xs text-muted-foreground">Téléphone</dt>
            <dd className="font-mono text-xs text-foreground/90">{client.telephone}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-muted-foreground">Dossiers</dt>
          <dd className="tabular-nums text-foreground/90">{client.nbDossiers}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-xs text-muted-foreground">Total dû</dt>
          <dd className="tabular-nums">
            {client.totalDu > 0 ? (
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {formatFCFA(client.totalDu)}
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400">Soldé</span>
            )}
          </dd>
        </div>
      </dl>
    </Card>
  );
});

const ClientTableRow = memo(function ClientTableRow({
  client,
  canWrite,
  onOpenClient,
  onEditClient,
}: {
  client: Client;
  canWrite: boolean;
  onOpenClient: (id: string) => void;
  onEditClient: (id: string, e: React.MouseEvent) => void;
}) {
  return (
    <TableRow
      role="button"
      tabIndex={0}
      className={cn(
        "cursor-pointer border-b border-border transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
        rowAccentClass(client.type),
      )}
      onClick={() => onOpenClient(client.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenClient(client.id);
        }
      }}
    >
      <TableCell className="min-w-[180px] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white",
              avatarGradient(client.type),
            )}
          >
            {getInitials(client.nom)}
          </div>
          <p className="truncate font-medium text-foreground">{client.nom}</p>
        </div>
      </TableCell>
      <TableCell className="w-[130px] px-4 py-3.5">
        <ClientTypeBadge type={client.type} size="sm" />
      </TableCell>
      <TableCell className="hidden px-4 py-3.5 lg:table-cell">
        <SocieteBadge societeNom={client.societeNom} societeId={client.societeId} size="sm" />
      </TableCell>
      <TableCell className="hidden min-w-[160px] px-4 py-3.5 md:table-cell">
        <div className="space-y-1 text-sm">
          {client.telephone ? (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="font-mono text-xs">{client.telephone}</span>
            </p>
          ) : (
            <p className="text-muted-foreground">—</p>
          )}
          {client.email && (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Mail className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-xs">{client.email}</span>
            </p>
          )}
        </div>
      </TableCell>
      <TableCell className="hidden max-w-[200px] px-4 py-3.5 lg:table-cell">
        {client.adresse ? (
          <p
            className="flex items-start gap-1.5 text-sm text-muted-foreground"
            title={client.adresse}
          >
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <span className="line-clamp-2">{client.adresse}</span>
          </p>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="px-4 py-3.5 text-center">
        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm font-medium tabular-nums text-slate-700 bg-muted dark:text-slate-300">
          <DossierIcon className="size-3.5" />
          {client.nbDossiers}
        </span>
      </TableCell>
      <TableCell className="px-4 py-3.5 text-right tabular-nums">
        {client.totalDu > 0 ? (
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            {formatFCFA(client.totalDu)}
          </span>
        ) : (
          <span className="text-sm text-emerald-600 dark:text-emerald-400">Soldé</span>
        )}
      </TableCell>
      <TableCell className="px-4 py-3.5">
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-primary"
            onClick={() => onOpenClient(client.id)}
            aria-label={`Voir la fiche de ${client.nom}`}
            title="Voir la fiche"
          >
            <Eye className="size-4" />
          </Button>
          {canWrite && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-primary"
              onClick={(e) => onEditClient(client.id, e)}
              aria-label={`Modifier ${client.nom}`}
              title="Modifier"
            >
              <Pencil className="size-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});

export function ClientsTable({
  paged,
  filteredCount,
  startIdx,
  endIdx,
  safePage,
  totalPages,
  hasActiveFilters,
  canWrite,
  sortBy,
  onSortChange,
  onPageChange,
  onOpenClient,
  onEditClient,
  onCreateClient,
}: ClientsTableProps) {
  if (filteredCount === 0) {
    return (
      <EmptyState
        icon={Users}
        title={
          hasActiveFilters
            ? UI.empty.clients.filtered.title
            : UI.empty.clients.zero.title
        }
        description={
          hasActiveFilters
            ? UI.empty.clients.filtered.description
            : UI.empty.clients.zero.description
        }
        primaryAction={
          !hasActiveFilters && canWrite && onCreateClient
            ? {
                label: UI.empty.clients.zero.action,
                onClick: onCreateClient,
                icon: UserPlus,
              }
            : undefined
        }
      />
    );
  }

  return (
    <>
      <div className="space-y-3 p-4 md:hidden">
        {paged.map((c) => (
          <ClientMobileCard
            key={c.id}
            client={c}
            canWrite={canWrite}
            onOpenClient={onOpenClient}
            onEditClient={onEditClient}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <Table aria-label="Liste des clients" className="min-w-[960px]">
          <TableHeader className="sticky top-0 z-10 bg-muted/50">
            <TableRow className="border-b border-border hover:bg-muted">
              <SortableHeader
                label="Client"
                sortKey="nom"
                activeSort={sortBy}
                onSortChange={onSortChange}
              />
              <TableHead className="h-10 w-[130px] px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Type
              </TableHead>
              <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">
                Société
              </TableHead>
              <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
                Contact
              </TableHead>
              <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">
                Adresse
              </TableHead>
              <SortableHeader
                label="Dossiers"
                sortKey="nbDossiers"
                activeSort={sortBy}
                align="center"
                onSortChange={onSortChange}
              />
              <SortableHeader
                label="Total dû"
                sortKey="totalDu"
                activeSort={sortBy}
                align="right"
                onSortChange={onSortChange}
              />
              <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((c) => (
              <ClientTableRow
                key={c.id}
                client={c}
                canWrite={canWrite}
                onOpenClient={onOpenClient}
                onEditClient={onEditClient}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        startIdx={startIdx}
        endIdx={endIdx}
        totalItems={filteredCount}
        itemLabel="clients"
        page={safePage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
}

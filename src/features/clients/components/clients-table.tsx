"use client";

import { memo } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  FolderKanban,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import type { Client } from "@/features/clients/types";
import { formatFCFA } from "@/lib/format";
import { cn, getInitials } from "@/shared/utils/cn";
import { UI } from "@/shared/utils/ui-messages";
import { EmptyState } from "@/components/sltt/empty-state";
import { TablePagination } from "@/components/sltt/table-pagination";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
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
  onDeleteClient: (id: string, e: React.MouseEvent) => void;
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
        "h-11 px-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
        align === "center" && "text-center",
        align === "right" && "text-right",
      )}
      aria-sort={ariaSort}
    >
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md transition-colors hover:text-primary",
          align === "center" && "mx-auto",
          align === "right" && "ml-auto",
          isActive && "text-primary font-black",
        )}
        onClick={() => onSortChange(sortKey)}
      >
        <span>{label}</span>
        {isActive &&
          (sortKey === "nom" ? (
            <ArrowUp className="size-3.5 shrink-0 text-primary" aria-hidden />
          ) : (
            <ArrowDown className="size-3.5 shrink-0 text-primary" aria-hidden />
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
  onDeleteClient,
}: {
  client: Client;
  canWrite: boolean;
  onOpenClient: (id: string) => void;
  onEditClient: (id: string, e: React.MouseEvent) => void;
  onDeleteClient: (id: string, e: React.MouseEvent) => void;
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer rounded-2xl border border-border/80 p-4 shadow-xs transition-all hover:border-primary/40 hover:shadow-md active:bg-slate-50 dark:active:bg-slate-800/60",
        rowAccentClass(client.type),
      )}
      onClick={() => onOpenClient(client.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white shadow-xs",
              avatarGradient(client.type),
            )}
          >
            {getInitials(client.nom)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-foreground text-sm">{client.nom}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <ClientTypeBadge type={client.type} size="sm" />
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
            className="size-8 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
            onClick={() => onOpenClient(client.id)}
            aria-label={`Voir la fiche de ${client.nom}`}
          >
            <Eye className="size-4" />
          </Button>
          {canWrite && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
                onClick={(e) => onEditClient(client.id, e)}
                aria-label={`Modifier ${client.nom}`}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-[#ED1C24] dark:hover:bg-red-950/40"
                onClick={(e) => onDeleteClient(client.id, e)}
                aria-label={`Supprimer ${client.nom}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <dl className="mt-3.5 space-y-2 text-xs border-t border-border/60 pt-3">
        {client.telephone && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Téléphone</dt>
            <dd className="font-mono text-foreground font-medium">{client.telephone}</dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Dossiers rattachés</dt>
          <dd className="inline-flex items-center gap-1 font-bold tabular-nums text-foreground">
            <FolderKanban className="size-3 text-primary" />
            <span>{client.nbDossiers}</span>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Total dû</dt>
          <dd className="tabular-nums">
            {client.totalDu > 0 ? (
              <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200/80 px-2 py-0.5 text-xs font-bold text-[#ED1C24] dark:text-red-400">
                {formatFCFA(client.totalDu)}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Soldé
              </span>
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
  onDeleteClient,
}: {
  client: Client;
  canWrite: boolean;
  onOpenClient: (id: string) => void;
  onEditClient: (id: string, e: React.MouseEvent) => void;
  onDeleteClient: (id: string, e: React.MouseEvent) => void;
}) {
  return (
    <TableRow
      role="button"
      tabIndex={0}
      className={cn(
        "cursor-pointer border-b border-border/60 transition-colors hover:bg-slate-50/80 dark:hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
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
      {/* Client nom + avatar */}
      <TableCell className="min-w-[200px] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white shadow-xs",
              avatarGradient(client.type),
            )}
          >
            {getInitials(client.nom)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-foreground text-sm">{client.nom}</p>
          </div>
        </div>
      </TableCell>

      {/* Type badge */}
      <TableCell className="w-[140px] px-4 py-3.5">
        <ClientTypeBadge type={client.type} size="sm" />
      </TableCell>

      {/* Contact info */}
      <TableCell className="hidden min-w-[170px] px-4 py-3.5 md:table-cell">
        <div className="space-y-1 text-xs">
          {client.telephone ? (
            <p className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <Phone className="size-3.5 shrink-0 text-slate-400" />
              <span className="font-mono">{client.telephone}</span>
            </p>
          ) : (
            <p className="text-muted-foreground">—</p>
          )}
          {client.email && (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Mail className="size-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{client.email}</span>
            </p>
          )}
        </div>
      </TableCell>

      {/* Adresse */}
      <TableCell className="hidden max-w-[200px] px-4 py-3.5 lg:table-cell">
        {client.adresse ? (
          <p
            className="flex items-start gap-1.5 text-xs text-muted-foreground"
            title={client.adresse}
          >
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
            <span className="line-clamp-2">{client.adresse}</span>
          </p>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>

      {/* Nb dossiers */}
      <TableCell className="px-4 py-3.5 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-muted px-2.5 py-1 text-xs font-bold tabular-nums text-foreground">
          <FolderKanban className="size-3 text-primary" />
          <span>{client.nbDossiers}</span>
        </span>
      </TableCell>

      {/* Total dû */}
      <TableCell className="px-4 py-3.5 text-right tabular-nums">
        {client.totalDu > 0 ? (
          <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200/80 px-2.5 py-1 text-xs font-bold text-[#ED1C24] dark:text-red-400">
            {formatFCFA(client.totalDu)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Soldé
          </span>
        )}
      </TableCell>

      {/* Actions */}
      <TableCell className="px-4 py-3.5">
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => onOpenClient(client.id)}
            aria-label={`Voir la fiche de ${client.nom}`}
            title="Voir la fiche client"
          >
            <Eye className="size-4" />
          </Button>
          {canWrite && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={(e) => onEditClient(client.id, e)}
                aria-label={`Modifier ${client.nom}`}
                title="Modifier le client"
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-[#ED1C24] dark:hover:bg-red-950/40 transition-colors"
                onClick={(e) => onDeleteClient(client.id, e)}
                aria-label={`Supprimer ${client.nom}`}
                title="Supprimer le client"
              >
                <Trash2 className="size-4" />
              </Button>
            </>
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
  onDeleteClient,
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
            onDeleteClient={onDeleteClient}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <Table aria-label="Liste des clients" className="min-w-[960px]">
          <TableHeader className="sticky top-0 z-10 bg-slate-50/80 dark:bg-muted/40 border-b border-border/80">
            <TableRow className="hover:bg-transparent">
              <SortableHeader
                label="Client"
                sortKey="nom"
                activeSort={sortBy}
                onSortChange={onSortChange}
              />
              <TableHead className="h-11 w-[140px] px-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Type
              </TableHead>
              <TableHead className="hidden h-11 px-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground md:table-cell">
                Contact
              </TableHead>
              <TableHead className="hidden h-11 px-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground lg:table-cell">
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
              <TableHead className="h-11 px-4 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/60">
            {paged.map((c) => (
              <ClientTableRow
                key={c.id}
                client={c}
                canWrite={canWrite}
                onOpenClient={onOpenClient}
                onEditClient={onEditClient}
                onDeleteClient={onDeleteClient}
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

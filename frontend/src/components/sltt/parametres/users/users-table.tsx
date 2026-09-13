"use client";

import { Pencil, Trash2, Search, Filter } from "lucide-react";
import type { User as UserAccount } from "@/lib/store";
import { getModuleSummary } from "@/lib/permissions";
import { formatDateShort } from "@/lib/format";
import { ToneBadge } from "@/components/sltt/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn, getInitials, USER_AVATAR_GRADIENT } from "@/lib/utils";
import { TablePagination } from "@/components/sltt/table-pagination";
import { UsersEmptyState } from "./users-empty-state";
import {
  allRoles,
  isCustomPermissionSet,
  roleTone,
  type RoleFilter,
} from "./shared";

export function UsersStatsRow({
  stats,
}: {
  stats: { total: number; actifs: number; inactifs: number };
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        { label: "Total", value: stats.total, tone: "text-foreground" },
        { label: "Actifs", value: stats.actifs, tone: "text-emerald-600 dark:text-emerald-400" },
        { label: "Inactifs", value: stats.inactifs, tone: "text-muted-foreground" },
      ].map((kpi) => (
        <Card key={kpi.label} className="border-border/80 px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
          <p className={cn("mt-1 text-2xl font-bold tabular-nums", kpi.tone)}>{kpi.value}</p>
        </Card>
      ))}
    </div>
  );
}

export function UsersTable({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  filtered,
  paged,
  hasFilters,
  onCreate,
  currentUserId,
  isCurrentAdmin,
  actionDisabledReason,
  onEdit,
  onDelete,
  onToggleActive,
  safePage,
  totalPages,
  startIdx,
  endIdx,
  onPageChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  roleFilter: RoleFilter;
  onRoleFilterChange: (v: RoleFilter) => void;
  filtered: UserAccount[];
  paged: UserAccount[];
  hasFilters: boolean;
  onCreate: () => void;
  currentUserId?: string;
  isCurrentAdmin: boolean;
  actionDisabledReason: (u: UserAccount) => string | undefined;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (u: UserAccount) => Promise<void>;
  safePage: number;
  totalPages: number;
  startIdx: number;
  endIdx: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <Card className="overflow-hidden border-border/80 p-0 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 bg-muted/30 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par nom, e-mail ou rôle…"
            className="h-10 bg-white pl-9 bg-card"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => onRoleFilterChange(v as RoleFilter)}>
          <SelectTrigger className="h-10 w-full sm:w-[200px] bg-card">
            <Filter className="mr-2 size-3.5 text-slate-400" />
            <SelectValue placeholder="Tous les rôles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            {allRoles.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <UsersEmptyState hasFilters={hasFilters} onCreate={onCreate} />
      ) : (
        <>
          <div className="space-y-3 p-4 md:hidden">
            {paged.map((u) => (
              <Card key={u.id} className="border-border/80 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white", USER_AVATAR_GRADIENT)}>
                      {getInitials(u.nom)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{u.nom}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => onEdit(u.id)}
                      aria-label={`Modifier ${u.nom}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-slate-400 hover:text-destructive disabled:opacity-30"
                      disabled={u.id === currentUserId || (u.role === "Administrateur" && !isCurrentAdmin)}
                      title={actionDisabledReason(u)}
                      onClick={() => onDelete(u.id)}
                      aria-label={`Supprimer ${u.nom}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-xs text-muted-foreground">Rôle</dt>
                    <dd className="flex flex-wrap justify-end gap-1.5">
                      <ToneBadge tone={roleTone[u.role]}>{u.role}</ToneBadge>
                      {isCustomPermissionSet(u.role, u.permissions) && (
                        <ToneBadge tone="slate" dot={false}>Personnalisé</ToneBadge>
                      )}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-xs text-muted-foreground">Statut</dt>
                    <dd className="flex items-center gap-2">
                      <Switch
                        checked={u.actif}
                        disabled={u.id === currentUserId || (u.role === "Administrateur" && !isCurrentAdmin)}
                        title={actionDisabledReason(u)}
                        onCheckedChange={() => void onToggleActive(u)}
                        aria-label={`Statut de ${u.nom}`}
                      />
                      <ToneBadge tone={u.actif ? "emerald" : "slate"}>
                        {u.actif ? "Actif" : "Inactif"}
                      </ToneBadge>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-xs text-muted-foreground">Dernière connexion</dt>
                    <dd className="tabular-nums text-foreground/90">{formatDateShort(u.derniereConnexion)}</dd>
                  </div>
                </dl>
              </Card>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-white hover:bg-card hover:bg-muted/60">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Utilisateur</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rôle</TableHead>
                  <TableHead className="hidden text-xs font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">
                    Modules
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Statut</TableHead>
                  <TableHead className="hidden text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:table-cell">
                    Dernière connexion
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((u) => (
                  <TableRow
                    key={u.id}
                    className="group border-b border-border/60 hover:bg-muted/40"
                  >
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white", USER_AVATAR_GRADIENT)}>
                          {getInitials(u.nom)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{u.nom}</p>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <ToneBadge tone={roleTone[u.role]}>{u.role}</ToneBadge>
                        {isCustomPermissionSet(u.role, u.permissions) && (
                          <span title="Les permissions de cet utilisateur diffèrent du standard de son rôle">
                            <ToneBadge tone="slate" dot={false}>
                              Personnalisé
                            </ToneBadge>
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden py-3.5 md:table-cell">
                      <div className="flex max-w-[200px] flex-wrap gap-1">
                        {getModuleSummary(u.permissions).slice(0, 3).map((label) => (
                          <span
                            key={label}
                            className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted"
                          >
                            {label}
                          </span>
                        ))}
                        {getModuleSummary(u.permissions).length > 3 && (
                          <span className="text-[10px] text-slate-400">
                            +{getModuleSummary(u.permissions).length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={u.actif}
                          disabled={u.id === currentUserId || (u.role === "Administrateur" && !isCurrentAdmin)}
                          title={actionDisabledReason(u)}
                          onCheckedChange={() => void onToggleActive(u)}
                          aria-label={`Statut de ${u.nom}`}
                        />
                        <ToneBadge tone={u.actif ? "emerald" : "slate"}>
                          {u.actif ? "Actif" : "Inactif"}
                        </ToneBadge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden py-3.5 tabular-nums text-sm text-muted-foreground lg:table-cell">
                      {formatDateShort(u.derniereConnexion)}
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 opacity-70 group-hover:opacity-100"
                          onClick={() => onEdit(u.id)}
                          title="Modifier"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-slate-400 opacity-70 hover:text-destructive group-hover:opacity-100 disabled:opacity-30"
                          disabled={u.id === currentUserId || (u.role === "Administrateur" && !isCurrentAdmin)}
                          onClick={() => onDelete(u.id)}
                          title={actionDisabledReason(u) ?? "Supprimer"}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={safePage}
            totalPages={totalPages}
            startIdx={startIdx}
            endIdx={endIdx}
            totalItems={filtered.length}
            onPageChange={onPageChange}
            itemLabel="utilisateurs"
          />
        </>
      )}
    </Card>
  );
}

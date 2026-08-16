"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ScrollText, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import type { AuditAction } from "@/lib/store";
import { formatDateTime } from "@/lib/format";
import { ToneBadge } from "@/components/sltt/status-badge";
import { Card } from "@/components/ui/card";
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
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const AUDIT_PAGE_SIZE = 8;

const actionTone: Record<
  AuditAction,
  "blue" | "emerald" | "amber" | "indigo" | "slate" | "red"
> = {
  Connexion: "slate",
  Création: "blue",
  Modification: "indigo",
  Validation: "emerald",
  Paiement: "emerald",
  Export: "amber",
  Suppression: "red",
};

export function AuditTab() {
  const auditLogs = useStore((s) => s.auditLogs);
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const modules = useMemo(
    () => [...new Set(auditLogs.map((e) => e.module))].sort(),
    [auditLogs],
  );
  const actions = useMemo(
    () => [...new Set(auditLogs.map((e) => e.action))].sort(),
    [auditLogs],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return auditLogs.filter((e) => {
      if (moduleFilter !== "all" && e.module !== moduleFilter) return false;
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      if (q) {
        const haystack = `${e.user} ${e.module} ${e.action} ${e.detail} ${e.ip}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [auditLogs, query, moduleFilter, actionFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / AUDIT_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * AUDIT_PAGE_SIZE,
    safePage * AUDIT_PAGE_SIZE,
  );
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * AUDIT_PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * AUDIT_PAGE_SIZE, filtered.length);

  const hasActiveFilters =
    query.trim() !== "" || moduleFilter !== "all" || actionFilter !== "all";

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Journal des actions utilisateurs — connexions, modifications et opérations
        sensibles.
      </p>

      <Card className="p-4 shadow-sm border-border/80">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher utilisateur, action…"
              className="h-10 pl-9"
              aria-label="Rechercher dans le journal d'audit"
            />
          </div>

          <Select
            value={moduleFilter}
            onValueChange={(v) => {
              setModuleFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-48" aria-label="Filtrer par module">
              <SelectValue placeholder="Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les modules</SelectItem>
              {modules.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={actionFilter}
            onValueChange={(v) => {
              setActionFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-40" aria-label="Filtrer par action">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 text-muted-foreground"
              onClick={() => {
                setQuery("");
                setModuleFilter("all");
                setActionFilter("all");
                setPage(1);
              }}
            >
              Réinitialiser
            </Button>
          )}

          <p className="ml-auto text-xs tabular-nums text-muted-foreground">
            {filtered.length} entrée{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </Card>

      <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <ScrollText className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Journal d&apos;audit
          </h3>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Aucune entrée ne correspond aux filtres sélectionnés.
          </div>
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {paged.map((row) => (
                <Card key={row.id} className="border-border/80 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{row.user}</p>
                      <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{formatDateTime(row.date)}</p>
                    </div>
                    <ToneBadge tone={actionTone[row.action]}>{row.action}</ToneBadge>
                  </div>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-muted-foreground">Module</dt>
                      <dd><ToneBadge tone="slate">{row.module}</ToneBadge></dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className="shrink-0 text-xs text-muted-foreground">Détail</dt>
                      <dd className="text-right text-foreground/90">{row.detail}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-muted-foreground">IP</dt>
                      <dd className="font-mono text-xs text-muted-foreground">{row.ip}</dd>
                    </div>
                  </dl>
                </Card>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/50 hover:bg-muted">
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Date / Heure
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Utilisateur
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                      Module
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Action
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Détail
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
                      IP
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-b border-border hover:bg-muted/60"
                    >
                      <TableCell className="px-4 py-3.5 tabular-nums text-muted-foreground">
                        {formatDateTime(row.date)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 font-medium text-foreground">
                        {row.user}
                      </TableCell>
                      <TableCell className="hidden px-4 py-3.5 sm:table-cell">
                        <ToneBadge tone="slate">{row.module}</ToneBadge>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <ToneBadge tone={actionTone[row.action]}>{row.action}</ToneBadge>
                      </TableCell>
                      <TableCell className="max-w-[280px] px-4 py-3.5 text-sm text-muted-foreground">
                        <span className="line-clamp-2" title={row.detail}>
                          {row.detail}
                        </span>
                      </TableCell>
                      <TableCell className="hidden px-4 py-3.5 font-mono text-xs text-muted-foreground md:table-cell">
                        {row.ip}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs tabular-nums text-muted-foreground">
                {startIdx}–{endIdx} sur {filtered.length} entrée
                {filtered.length !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-[4.5rem] text-center text-xs tabular-nums text-muted-foreground">
                  {safePage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Page suivante"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

"use client";

import * as React from "react";
import { memo } from "react";
import { Handshake, Banknote, Link2, Pencil, Trash2, Phone, Mail } from "lucide-react";
import type { Fournisseur, Dossier, DossierFournisseur } from "@/lib/store";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { ActifStatutBadge, DossierFournisseurStatutBadge } from "@/components/sltt/status-badge";
import { EmptyState } from "@/components/sltt/empty-state";
import { TablePagination } from "@/components/sltt/table-pagination";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/utils/cn";
import type { FournisseurType } from "@/lib/store";
import { TYPE_META, getFournisseurTypeMeta } from "./fournisseur-type-meta";

interface PaginationProps {
  startIdx: number;
  endIdx: number;
  totalItems: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function TypeBadge({ type }: { type?: FournisseurType | string }) {
  const m = getFournisseurTypeMeta(type);
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-0.5 text-[11px] font-semibold",
        m.bg,
        m.color,
      )}
    >
      <Icon className="size-3" />
      <span className="hidden lg:inline">{type || "Autre"}</span>
      <span className="lg:hidden">{m.short}</span>
    </span>
  );
}

const HEAD_CLASS =
  "h-10 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

const PrestataireRow = memo(function PrestataireRow({
  f,
  canWrite,
  onEdit,
  onDelete,
}: {
  f: Fournisseur;
  canWrite: boolean;
  onEdit: (f: Fournisseur) => void;
  onDelete: (id: string) => void;
}) {
  const m = getFournisseurTypeMeta(f?.type);
  const Icon = m.icon;
  return (
    <TableRow className="border-b border-border/60 hover:bg-muted/50">
      {/* Prestataire */}
      <TableCell className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", m.bg)}>
            <Icon className={cn("size-[17px]", m.color)} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{f.nom}</p>
            <p className="truncate text-xs text-muted-foreground">
              {f.adresse || f.contact || f.telephone || "—"}
            </p>
          </div>
        </div>
      </TableCell>

      {/* Type */}
      <TableCell className="hidden px-4 py-3 sm:table-cell">
        <TypeBadge type={f.type} />
      </TableCell>

      {/* Contact */}
      <TableCell className="hidden max-w-[160px] px-4 py-3 text-sm text-foreground/90 md:table-cell">
        <span className="truncate">{f.contact || <span className="text-muted-foreground">—</span>}</span>
      </TableCell>

      {/* Téléphone */}
      <TableCell className="hidden px-4 py-3 sm:table-cell">
        {f.telephone ? (
          <a
            href={`tel:${f.telephone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-1.5 font-mono text-xs text-foreground/80 hover:text-primary"
          >
            <Phone className="size-3 shrink-0 text-muted-foreground" />
            {f.telephone}
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* E-mail */}
      <TableCell className="hidden max-w-[220px] px-4 py-3 lg:table-cell">
        {f.email ? (
          <a
            href={`mailto:${f.email}`}
            className="inline-flex items-center gap-1.5 truncate text-xs text-foreground/80 hover:text-primary"
          >
            <Mail className="size-3 shrink-0 text-muted-foreground" />
            <span className="truncate">{f.email}</span>
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Statut */}
      <TableCell className="px-4 py-3">
        <ActifStatutBadge statut={f.statut} />
      </TableCell>

      {/* Actions */}
      <TableCell className="px-3 py-3 text-right">
        {canWrite && (
          <div className="flex items-center justify-end gap-0.5">
            <Button
              size="icon"
              variant="ghost"
              className="size-8 text-muted-foreground hover:text-primary"
              aria-label={`Modifier ${f.nom}`}
              title="Modifier"
              onClick={() => onEdit(f)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-8 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
              aria-label={`Supprimer ${f.nom}`}
              title="Supprimer"
              onClick={() => onDelete(f.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
});

export function PrestatairesTable({
  items,
  canWrite,
  onEdit,
  onDelete,
  emptyAction,
  pagination,
}: {
  items: Fournisseur[];
  canWrite: boolean;
  onEdit: (f: Fournisseur) => void;
  onDelete: (id: string) => void;
  emptyAction?: React.ReactNode;
  pagination: PaginationProps;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Handshake}
        title="Aucun prestataire trouvé"
        description="Modifiez les filtres ou créez un nouveau prestataire."
        action={emptyAction}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/40">
              <TableHead className={HEAD_CLASS}>Prestataire</TableHead>
              <TableHead className={cn(HEAD_CLASS, "hidden sm:table-cell")}>Type</TableHead>
              <TableHead className={cn(HEAD_CLASS, "hidden md:table-cell")}>Contact</TableHead>
              <TableHead className={cn(HEAD_CLASS, "hidden sm:table-cell")}>Téléphone</TableHead>
              <TableHead className={cn(HEAD_CLASS, "hidden lg:table-cell")}>E-mail</TableHead>
              <TableHead className={HEAD_CLASS}>Statut</TableHead>
              <TableHead className={cn(HEAD_CLASS, "text-right")}>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((f) => (
              <PrestataireRow key={f.id} f={f} canWrite={canWrite} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </TableBody>
        </Table>
      </div>
      <TablePagination
        startIdx={pagination.startIdx}
        endIdx={pagination.endIdx}
        totalItems={pagination.totalItems}
        itemLabel="prestataires"
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={pagination.onPageChange}
      />
    </div>
  );
}

const TarifRow = memo(function TarifRow({
  f,
  canWrite,
  onEdit,
}: {
  f: Fournisseur;
  canWrite: boolean;
  onEdit: (f: Fournisseur) => void;
}) {
  const m = getFournisseurTypeMeta(f?.type);
  const Icon = m.icon;
  const hasTarif = f.tarifContractuel != null;
  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 border-t border-border/60 px-4 py-3 hover:bg-muted/60 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:gap-4 sm:px-5">
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", m.bg)}>
        <Icon className={cn("size-[18px]", m.color)} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {f.nom}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <TypeBadge type={f.type} />
          <span className="text-slate-400">
            {f.nbDossiers} dossier{f.nbDossiers === 1 ? "" : "s"}
          </span>
        </p>
      </div>
      <p
        className={cn(
          "text-right text-sm tabular-nums",
          hasTarif
            ? "font-semibold text-violet-700 dark:text-violet-300"
            : "text-muted-foreground",
        )}
      >
        {hasTarif ? formatFCFA(f.tarifContractuel!) : "Non défini"}
      </p>
      <p className="hidden text-right text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200 sm:block">
        {formatFCFA(f.montantTotal)}
      </p>
      <div className="flex justify-end">
        {canWrite && (
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            aria-label={`Modifier le tarif de ${f.nom}`}
            onClick={() => onEdit(f)}
          >
            <Pencil className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
});

export function TarifsTable({
  items,
  canWrite,
  onEdit,
  emptyAction,
  pagination,
}: {
  items: Fournisseur[];
  canWrite: boolean;
  onEdit: (f: Fournisseur) => void;
  emptyAction?: React.ReactNode;
  pagination: PaginationProps;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Banknote}
        title="Aucun tarif à afficher"
        description="Aucun prestataire ne correspond aux filtres."
        action={emptyAction}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-border/70 overflow-hidden shadow-xs bg-card">
      <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-border/60 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:gap-4 sm:px-5">
        <span className="w-10" />
        <span>Prestataire</span>
        <span className="text-right">Tarif contractuel</span>
        <span className="hidden text-right sm:block">Cumul dossiers</span>
        <span className="w-10" />
      </div>
      {items.map((f) => (
        <TarifRow key={f.id} f={f} canWrite={canWrite} onEdit={onEdit} />
      ))}
      <TablePagination
        startIdx={pagination.startIdx}
        endIdx={pagination.endIdx}
        totalItems={pagination.totalItems}
        itemLabel="tarifs"
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={pagination.onPageChange}
      />
    </div>
  );
}

export type LiaisonEnrichie = DossierFournisseur & { dossier?: Dossier };

const CoutRow = memo(function CoutRow({
  df,
  onOpenDossier,
}: {
  df: LiaisonEnrichie;
  onOpenDossier: (dossierId: string) => void;
}) {
  const ecart = df.montantReel - df.montantBudgete;
  const m = getFournisseurTypeMeta(df?.type);
  const Icon = m.icon;
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-t border-border/60 px-4 py-3 hover:bg-muted/60 sm:grid-cols-[1fr_auto_auto_auto_auto_auto] sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "hidden size-9 shrink-0 items-center justify-center rounded-lg sm:flex",
            m.bg,
          )}
        >
          <Icon className={cn("size-4", m.color)} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
            {df.fournisseurNom}
          </p>
          <button
            type="button"
            onClick={() => onOpenDossier(df.dossierId)}
            className="truncate text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            {df.dossierRef ?? df.dossierId} · {formatDateShort(df.date)}
          </button>
        </div>
      </div>
      <p className="hidden max-w-[160px] truncate text-xs text-muted-foreground sm:block">
        {df.description}
      </p>
      <p className="text-right text-sm tabular-nums text-muted-foreground">
        {formatFCFA(df.montantBudgete)}
      </p>
      <p className="text-right text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200">
        {formatFCFA(df.montantReel)}
      </p>
      <p
        className={cn(
          "hidden text-sm font-semibold tabular-nums sm:block",
          ecart > 0
            ? "text-red-600 dark:text-red-400"
            : ecart < 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground",
        )}
      >
        {ecart > 0 ? "+" : ""}
        {formatFCFA(ecart)}
      </p>
      <DossierFournisseurStatutBadge statut={df.statut} />
    </div>
  );
});

export function CoutsTable({
  items,
  onOpenDossier,
  pagination,
}: {
  items: LiaisonEnrichie[];
  onOpenDossier: (dossierId: string) => void;
  pagination: PaginationProps;
}) {
  return (
    <div className="rounded-2xl border border-border/70 overflow-hidden shadow-xs bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          Liaisons dossiers
        </h2>
        <Badge variant="secondary" className="text-[10px]">
          {pagination.totalItems} prestation
          {pagination.totalItems === 1 ? "" : "s"}
        </Badge>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="Aucune liaison dossier"
          description="Les prestations rattachées aux dossiers apparaîtront ici pour le suivi budgétaire."
          className="m-4 border-0 bg-transparent"
        />
      ) : (
        <>
          <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-border/60 sm:grid-cols-[1fr_auto_auto_auto_auto_auto] sm:px-5">
            <span>Prestataire / Dossier</span>
            <span className="hidden sm:block">Description</span>
            <span className="text-right">Budgété</span>
            <span className="text-right">Réel</span>
            <span className="hidden sm:block">Écart</span>
            <span>Statut</span>
          </div>
          {items.map((df) => (
            <CoutRow key={df.id} df={df} onOpenDossier={onOpenDossier} />
          ))}
          <TablePagination
            startIdx={pagination.startIdx}
            endIdx={pagination.endIdx}
            totalItems={pagination.totalItems}
            itemLabel="prestations"
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
          />
        </>
      )}
    </div>
  );
}

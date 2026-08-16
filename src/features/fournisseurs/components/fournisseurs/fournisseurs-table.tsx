"use client";

import * as React from "react";
import { Handshake, Banknote, Link2, Pencil, Trash2 } from "lucide-react";
import type { Fournisseur, Dossier, DossierFournisseur } from "@/lib/store";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { ActifStatutBadge, DossierFournisseurStatutBadge } from "@/components/sltt/status-badge";
import { EmptyState } from "@/components/sltt/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FournisseurType } from "@/lib/store";
import { TYPE_META } from "./fournisseur-type-meta";

function TypeBadge({ type }: { type: FournisseurType }) {
  const m = TYPE_META[type];
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
      <span className="hidden lg:inline">{type}</span>
      <span className="lg:hidden">{m.short}</span>
    </span>
  );
}

export function PrestatairesTable({
  items,
  canWrite,
  onEdit,
  onDelete,
  emptyAction,
}: {
  items: Fournisseur[];
  canWrite: boolean;
  onEdit: (f: Fournisseur) => void;
  onDelete: (id: string) => void;
  emptyAction?: React.ReactNode;
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
    <div className="overflow-hidden rounded-xl border border-border/80 bg-white shadow-sm dark:bg-slate-900">
      <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:bg-slate-800 dark:text-slate-500 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:gap-4 sm:px-5">
        <span className="sr-only sm:not-sr-only sm:w-9">Type</span>
        <span>Prestataire</span>
        <span className="hidden text-right sm:block">Contact</span>
        <span>Statut</span>
        <span className="w-16" />
      </div>
      {items.map((f) => {
        const m = TYPE_META[f.type];
        const Icon = m.icon;
        return (
          <div
            key={f.id}
            className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 border-t border-border/60 px-4 py-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:gap-4 sm:px-5"
          >
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", m.bg)}>
              <Icon className={cn("size-[18px]", m.color)} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {f.nom}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <TypeBadge type={f.type} />
                <span className="truncate text-xs text-slate-400 dark:text-slate-500 sm:hidden">
                  {f.contact || f.telephone || "—"}
                </span>
              </div>
            </div>
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm text-slate-700 dark:text-slate-200">
                {f.contact || "—"}
              </p>
              <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                {f.telephone || f.email || "—"}
              </p>
            </div>
            <ActifStatutBadge statut={f.statut} />
            <div className="flex items-center justify-end gap-0.5">
              {canWrite && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    aria-label={`Modifier ${f.nom}`}
                    onClick={() => onEdit(f)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                    aria-label={`Supprimer ${f.nom}`}
                    onClick={() => onDelete(f.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TarifsTable({
  items,
  canWrite,
  onEdit,
  emptyAction,
}: {
  items: Fournisseur[];
  canWrite: boolean;
  onEdit: (f: Fournisseur) => void;
  emptyAction?: React.ReactNode;
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
    <div className="overflow-hidden rounded-xl border border-border/80 bg-white shadow-sm dark:bg-slate-900">
      <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:bg-slate-800 dark:text-slate-500 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:gap-4 sm:px-5">
        <span className="w-10" />
        <span>Prestataire</span>
        <span className="text-right">Tarif contractuel</span>
        <span className="hidden text-right sm:block">Cumul dossiers</span>
        <span className="w-10" />
      </div>
      {items.map((f) => {
        const m = TYPE_META[f.type];
        const Icon = m.icon;
        const hasTarif = f.tarifContractuel != null;
        return (
          <div
            key={f.id}
            className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 border-t border-border/60 px-4 py-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:gap-4 sm:px-5"
          >
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", m.bg)}>
              <Icon className={cn("size-[18px]", m.color)} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {f.nom}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
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
                  : "text-slate-400 dark:text-slate-500",
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
      })}
    </div>
  );
}

export type LiaisonEnrichie = DossierFournisseur & { dossier?: Dossier };

export function CoutsTable({
  items,
  onOpenDossier,
}: {
  items: LiaisonEnrichie[];
  onOpenDossier: (dossierId: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-white shadow-sm dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Liaisons dossiers
        </h2>
        <Badge variant="secondary" className="text-[10px]">
          {items.length} prestation
          {items.length === 1 ? "" : "s"}
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
          <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 bg-slate-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:bg-slate-800 dark:text-slate-500 sm:grid-cols-[1fr_auto_auto_auto_auto_auto] sm:px-5">
            <span>Prestataire / Dossier</span>
            <span className="hidden sm:block">Description</span>
            <span className="text-right">Budgété</span>
            <span className="text-right">Réel</span>
            <span className="hidden sm:block">Écart</span>
            <span>Statut</span>
          </div>
          {items.map((df) => {
            const ecart = df.montantReel - df.montantBudgete;
            const m = TYPE_META[df.type];
            const Icon = m.icon;
            return (
              <div
                key={df.id}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-t border-border/60 px-4 py-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 sm:grid-cols-[1fr_auto_auto_auto_auto_auto] sm:px-5"
              >
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
                <p className="hidden max-w-[160px] truncate text-xs text-slate-500 dark:text-slate-400 sm:block">
                  {df.description}
                </p>
                <p className="text-right text-sm tabular-nums text-slate-500 dark:text-slate-400">
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
                        : "text-slate-400 dark:text-slate-500",
                  )}
                >
                  {ecart > 0 ? "+" : ""}
                  {formatFCFA(ecart)}
                </p>
                <DossierFournisseurStatutBadge statut={df.statut} />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

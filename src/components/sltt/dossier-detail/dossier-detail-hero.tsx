"use client";

import {
  ArrowLeft,
  Pencil,
  FileText,
  Receipt,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  AlertTriangle,
  CalendarClock,
  Wallet,
  TrendingUp,
  Clock,
} from "lucide-react";
import type { Dossier } from "@/lib/domain-types";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { GLOSSARY } from "@/lib/glossary";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KpiCard } from "@/components/sltt/kpi-card";
import { DossierStatutBadge } from "@/components/sltt/status-badge";
import {
  TRANSITION_META,
  type TransitionType,
} from "@/components/sltt/dossier-transition-dialog";
import { DossierDetailStepper } from "./dossier-detail-stepper";
import { cn } from "@/lib/utils";

export function DossierDetailHero({
  dossier,
  reste,
  ecart,
  tauxRecouvrement,
  joursRestants,
  echeanceDepassee,
  echeanceImminente,
  nextTransition,
  canWrite,
  canTransition,
  onBack,
  onEdit,
  onTransition,
  onInvoice,
  onPdf,
  onDelete,
}: {
  dossier: Dossier;
  reste: number;
  ecart: number;
  tauxRecouvrement: number;
  joursRestants: number | null;
  echeanceDepassee: boolean;
  echeanceImminente: boolean;
  nextTransition: TransitionType | null;
  canWrite: boolean;
  canTransition: boolean;
  onBack: () => void;
  onEdit: () => void;
  onTransition: () => void;
  onInvoice: () => void;
  onPdf: () => void;
  onDelete: () => void;
}) {
  const transitionMeta = nextTransition ? TRANSITION_META[nextTransition] : null;
  const TransitionIcon = transitionMeta?.icon;

  let echeanceKpiValue = "—";
  let echeanceTone: "blue" | "emerald" | "amber" | "red" | "indigo" | "violet" = "blue";
  if (dossier.dateEcheance) {
    if (echeanceDepassee && joursRestants != null) {
      echeanceKpiValue = `Dépassée (${Math.abs(joursRestants)}j)`;
      echeanceTone = "red";
    } else if (echeanceImminente && joursRestants != null) {
      echeanceKpiValue = `${joursRestants} jour${joursRestants > 1 ? "s" : ""}`;
      echeanceTone = "amber";
    } else if (joursRestants != null) {
      echeanceKpiValue = formatDateShort(dossier.dateEcheance);
      echeanceTone = "blue";
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Retour aux dossiers
      </button>

      {(echeanceDepassee || echeanceImminente) && dossier.dateEcheance && (
        <div
          className={cn(
            "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
            echeanceDepassee
              ? "border-red-200 bg-red-50/80 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
              : "border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200",
          )}
        >
          {echeanceDepassee ? (
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          ) : (
            <CalendarClock className="mt-0.5 size-5 shrink-0" />
          )}
          <div>
            <p className="font-semibold">
              {echeanceDepassee ? "Échéance dépassée" : "Échéance proche"}
            </p>
            <p className="mt-0.5 text-xs opacity-90">
              {echeanceDepassee
                ? `La date limite du ${formatDateShort(dossier.dateEcheance)} est dépassée — des surestaries peuvent s'appliquer.`
                : `Il reste ${joursRestants} jour${joursRestants !== 1 ? "s" : ""} avant le ${formatDateShort(dossier.dateEcheance)}.`}
            </p>
          </div>
        </div>
      )}

      <Card className="overflow-hidden border-border/80 shadow-sm">
        <div className="flex border-l-4 border-blue-600">
          <div className="flex-1 space-y-5 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-mono text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
                    {dossier.reference}
                  </h1>
                  <DossierStatutBadge statut={dossier.statut} />
                </div>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-medium">{dossier.clientNom}</span>
                  <span className="text-slate-400 dark:text-slate-500"> · </span>
                  {dossier.nature}
                </p>
              </div>
            </div>

            <DossierDetailStepper statut={dossier.statut} />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <KpiCard
                compact
                label="Reste à payer"
                value={formatFCFA(reste)}
                icon={Wallet}
                tone={reste > 0 ? "amber" : "emerald"}
                tooltip={GLOSSARY.resteAPayer.definition}
              />
              <KpiCard
                compact
                label="Recouvrement"
                value={`${tauxRecouvrement} %`}
                icon={TrendingUp}
                tone={tauxRecouvrement >= 100 ? "emerald" : "blue"}
                sublabel={`${formatFCFA(dossier.montantPaye)} / ${formatFCFA(dossier.montantInvesti)}`}
              />
              <KpiCard
                compact
                label="Échéance"
                value={echeanceKpiValue}
                icon={Clock}
                tone={echeanceTone}
              />
              <KpiCard
                compact
                label="Marge dossier"
                value={`${ecart >= 0 ? "+" : ""}${formatFCFA(ecart, false)}`}
                icon={TrendingUp}
                tone={ecart >= 0 ? "emerald" : "red"}
                tooltip={GLOSSARY.margeDossier.definition}
              />
            </div>

            <div className="flex flex-col gap-2 border-t border-border/50 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
              {nextTransition && transitionMeta && TransitionIcon ? (
                <Button
                  className="w-full gap-2 sm:w-auto"
                  onClick={onTransition}
                  disabled={!canTransition}
                  title={
                    !canTransition
                      ? "Vous n'avez pas la permission de changer le statut de ce dossier."
                      : undefined
                  }
                >
                  <TransitionIcon className="size-4" />
                  {transitionMeta.confirmLabel}
                  <ChevronRight className="size-4 opacity-70" />
                </Button>
              ) : null}
              {canWrite && (
                <Button variant="outline" className="w-full gap-2 sm:w-auto" onClick={onEdit}>
                  <Pencil className="size-4" />
                  Modifier
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full gap-2 sm:ml-auto sm:w-auto">
                    <MoreHorizontal className="size-4" />
                    Plus d&apos;actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={onInvoice}>
                    <Receipt className="mr-2 size-4" />
                    Créer une facture
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onPdf}>
                    <FileText className="mr-2 size-4" />
                    Exporter en PDF
                  </DropdownMenuItem>
                  {canWrite && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950/40"
                        onClick={onDelete}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Supprimer le dossier
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

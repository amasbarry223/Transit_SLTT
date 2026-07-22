"use client";

import {
  User,
  Package,
  FileText,
  Truck,
  Ship,
  Container,
  Scale,
  CalendarDays,
  CalendarClock,
  CalendarCheck2,
  AlertTriangle,
} from "lucide-react";
import type { Dossier } from "@/lib/domain-types";
import { formatDateShort } from "@/lib/format";
import { GlossaryLabel } from "@/components/sltt/glossary-label";
import { cn } from "@/lib/utils";

function InfoTile({
  icon: Icon,
  label,
  value,
  glossaryTerm,
  warn,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: React.ReactNode;
  value: React.ReactNode;
  glossaryTerm?: "bl";
  warn?: boolean;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-border/70 bg-slate-50/50 p-3 dark:bg-slate-900/40">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-400">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {glossaryTerm ? <GlossaryLabel term={glossaryTerm} showIcon /> : label}
        </p>
        <p
          className={cn(
            "mt-0.5 text-sm font-medium text-slate-900 dark:text-slate-100",
            warn && "text-amber-600 dark:text-amber-400",
          )}
        >
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export function DossierInfoGrid({
  dossier,
  echeanceDepassee,
  echeanceImminente,
  joursRestants,
}: {
  dossier: Dossier;
  echeanceDepassee: boolean;
  echeanceImminente: boolean;
  joursRestants: number | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <InfoTile icon={User} label="Client" value={dossier.clientNom} />
      <InfoTile icon={Package} label="Marchandise" value={dossier.nature} />
      <InfoTile
        icon={FileText}
        label="N° de BL"
        glossaryTerm="bl"
        value={<span className="font-mono">{dossier.bl}</span>}
      />
      <InfoTile
        icon={Truck}
        label="N° camion"
        value={<span className="font-mono">{dossier.camion}</span>}
      />
      {dossier.modeTransport && (
        <InfoTile icon={Ship} label="Mode de transport" value={dossier.modeTransport} />
      )}
      {dossier.portEntree && (
        <InfoTile icon={Ship} label="Port / frontière" value={dossier.portEntree} />
      )}
      {dossier.noConteneur && (
        <InfoTile
          icon={Container}
          label="N° conteneur"
          value={<span className="font-mono">{dossier.noConteneur}</span>}
        />
      )}
      {dossier.poidsTotal != null && dossier.poidsTotal > 0 && (
        <InfoTile
          icon={Scale}
          label="Poids total"
          value={`${dossier.poidsTotal.toLocaleString("fr-FR")} kg`}
        />
      )}
      <InfoTile
        icon={CalendarDays}
        label="Date d'ouverture"
        value={dossier.date ? formatDateShort(dossier.date) : "—"}
      />
      {dossier.dateEcheance && (
        <InfoTile
          icon={echeanceDepassee ? AlertTriangle : CalendarClock}
          label="Date d'échéance"
          warn={echeanceDepassee || echeanceImminente}
          value={
            <span className="inline-flex flex-wrap items-center gap-1">
              {formatDateShort(dossier.dateEcheance)}
              {echeanceDepassee && joursRestants != null && (
                <span className="text-xs font-normal">(dépassée de {Math.abs(joursRestants)}j)</span>
              )}
              {echeanceImminente && !echeanceDepassee && joursRestants != null && (
                <span className="text-xs font-normal">({joursRestants}j restants)</span>
              )}
            </span>
          }
        />
      )}
      {dossier.dateDedouanement && (
        <InfoTile
          icon={CalendarCheck2}
          label="Dédouanement"
          value={
            <span className="text-emerald-700 dark:text-emerald-400">
              {formatDateShort(dossier.dateDedouanement)}
            </span>
          }
        />
      )}
    </div>
  );
}

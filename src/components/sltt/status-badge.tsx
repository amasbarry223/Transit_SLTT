"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DossierStatut,
  EcritureStatut,
  StockStatut,
} from "@/lib/mock-data";
import type { FactureStatut } from "@/lib/store";

type Tone = "blue" | "emerald" | "amber" | "red" | "indigo" | "slate";

const toneClasses: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
  amber: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
  red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900",
  slate: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

const dotClasses: Record<Tone, string> = {
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  indigo: "bg-indigo-500",
  slate: "bg-slate-400",
};

export function ToneBadge({
  tone,
  children,
  className,
  dot = true,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full font-medium border gap-1.5 px-2.5 py-0.5",
        toneClasses[tone],
        className,
      )}
    >
      {dot && (
        <span className={cn("size-1.5 rounded-full", dotClasses[tone])} />
      )}
      {children}
    </Badge>
  );
}

/**
 * Canonical statut → tone mapping for Dossiers. This is the single source of
 * truth reused by the badge below, the dashboard charts, and the calendar —
 * do not redefine statut colors locally in a screen (LOGIC-04: three screens
 * used to disagree on which color meant "Livré" vs "Soldé").
 */
export const DOSSIER_STATUT_TONE: Record<DossierStatut, Tone> = {
  "En cours": "blue",
  Dédouané: "indigo",
  Livré: "amber",
  Soldé: "emerald",
};

export const DOSSIER_STATUT_DOT: Record<DossierStatut, string> = {
  "En cours": dotClasses[DOSSIER_STATUT_TONE["En cours"]],
  Dédouané: dotClasses[DOSSIER_STATUT_TONE["Dédouané"]],
  Livré: dotClasses[DOSSIER_STATUT_TONE["Livré"]],
  Soldé: dotClasses[DOSSIER_STATUT_TONE["Soldé"]],
};

export const DOSSIER_STATUT_HEX: Record<DossierStatut, string> = {
  "En cours": "#1E40AF",
  Dédouané: "#4F46E5",
  Livré: "#D97706",
  Soldé: "#059669",
};

export function DossierStatutBadge({ statut }: { statut: DossierStatut }) {
  return <ToneBadge tone={DOSSIER_STATUT_TONE[statut]}>{statut}</ToneBadge>;
}

export function EcritureStatutBadge({ statut }: { statut: EcritureStatut }) {
  const map: Record<EcritureStatut, Tone> = {
    Soldé: "emerald",
    "En attente": "amber",
  };
  return <ToneBadge tone={map[statut]}>{statut}</ToneBadge>;
}

export function StockStatutBadge({ statut }: { statut: StockStatut }) {
  const map: Record<StockStatut, Tone> = {
    Disponible: "emerald",
    "Stock faible": "red",
  };
  return <ToneBadge tone={map[statut]}>{statut}</ToneBadge>;
}

export function FactureStatutBadge({ statut }: { statut: FactureStatut }) {
  const map: Record<FactureStatut, Tone> = {
    Brouillon: "slate",
    Envoyée: "blue",
    Partielle: "amber",
    Soldée: "emerald",
    Annulée: "red",
  };
  return <ToneBadge tone={map[statut]}>{statut}</ToneBadge>;
}

export function DossierFournisseurStatutBadge({ statut }: { statut: "En attente" | "Payé" | "Litige" }) {
  const map: Record<"En attente" | "Payé" | "Litige", Tone> = {
    "En attente": "amber",
    Payé: "emerald",
    Litige: "red",
  };
  return <ToneBadge tone={map[statut]}>{statut}</ToneBadge>;
}

export function EcartValue({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="font-medium text-emerald-600 tabular-nums">
        +{value.toLocaleString("fr-FR")}
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="font-medium text-red-600 tabular-nums">
        {value.toLocaleString("fr-FR")}
      </span>
    );
  }
  return (
    <span className="font-medium text-slate-500 dark:text-slate-400 tabular-nums">
      {value.toLocaleString("fr-FR")}
    </span>
  );
}

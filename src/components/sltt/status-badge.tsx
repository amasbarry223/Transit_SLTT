"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DossierStatut,
  EcritureStatut,
  StockStatut,
} from "@/lib/mock-data";

type Tone = "blue" | "emerald" | "amber" | "red" | "indigo" | "slate";

const toneClasses: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
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

export function DossierStatutBadge({ statut }: { statut: DossierStatut }) {
  const map: Record<DossierStatut, Tone> = {
    "En cours": "blue",
    Dédouané: "indigo",
    Livré: "amber",
    Soldé: "emerald",
  };
  return <ToneBadge tone={map[statut]}>{statut}</ToneBadge>;
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
    <span className="font-medium text-slate-500 tabular-nums">
      {value.toLocaleString("fr-FR")}
    </span>
  );
}

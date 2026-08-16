"use client";

import { AlertCircle, CheckCircle2, Clock, Send, XCircle } from "lucide-react";
import type { DevisStatut } from "@/lib/store";

export type DevisStatutConfig = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  dot: string;
  text: string;
  desc: string;
};

export const STATUT_CONFIG: Record<DevisStatut, DevisStatutConfig> = {
  Brouillon: {
    label: "Brouillon", icon: Clock,
    badge: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400", text: "text-slate-700 dark:text-slate-300",
    desc: "Ce devis est en cours de rédaction.",
  },
  Envoyé: {
    label: "Envoyé", icon: Send,
    badge: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900",
    dot: "bg-blue-500", text: "text-blue-700 dark:text-blue-400",
    desc: "En attente du retour du client.",
  },
  Accepté: {
    label: "Accepté", icon: CheckCircle2,
    badge: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900",
    dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400",
    desc: "Le client a accepté l'estimation.",
  },
  Refusé: {
    label: "Refusé", icon: XCircle,
    badge: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900",
    dot: "bg-red-500", text: "text-red-600 dark:text-red-400",
    desc: "Le client a décliné l'estimation.",
  },
  Expiré: {
    label: "Expiré", icon: AlertCircle,
    badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900",
    dot: "bg-amber-400", text: "text-amber-700 dark:text-amber-400",
    desc: "La date de validité est dépassée.",
  },
};

export const STATUT_FLOW: DevisStatut[] = ["Brouillon", "Envoyé", "Accepté"];
export const STATUTS_ALL: DevisStatut[] = ["Brouillon", "Envoyé", "Accepté", "Refusé", "Expiré"];

export type DevisNextStatut = {
  to: DevisStatut;
  label: string;
  quickLabel: string;
  colorClass: string;
  bgClass: string;
};

export const NEXT_STATUT: Partial<Record<DevisStatut, DevisNextStatut>> = {
  Brouillon: {
    to: "Envoyé",
    label: "Marquer comme envoyé",
    quickLabel: "→ Envoyer",
    colorClass: "text-blue-700 dark:text-blue-300",
    bgClass: "bg-blue-50 dark:bg-blue-950/40",
  },
  Envoyé: {
    to: "Accepté",
    label: "Marquer comme accepté",
    quickLabel: "→ Accepter",
    colorClass: "text-emerald-700 dark:text-emerald-300",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/40",
  },
};

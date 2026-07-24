import type { ComponentType } from "react";
import { Banknote, CheckCircle2, Clock, Send, XCircle } from "lucide-react";
import type { FactureStatut } from "@/lib/store";

export type StatutCfg = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge: string;
  dot: string;
  text: string;
  desc: string;
};

export const STATUT_CONFIG: Record<FactureStatut, StatutCfg> = {
  Brouillon: {
    label: "Brouillon",
    icon: Clock,
    badge: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
    text: "text-slate-700 dark:text-slate-300",
    desc: "Facture en cours de rédaction.",
  },
  Envoyée: {
    label: "Envoyée",
    icon: Send,
    badge: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900",
    dot: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-400",
    desc: "Transmise au client, en attente de règlement.",
  },
  Partielle: {
    label: "Partielle",
    icon: Banknote,
    badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    desc: "Un paiement partiel a été enregistré.",
  },
  Soldée: {
    label: "Soldée",
    icon: CheckCircle2,
    badge: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    desc: "Facture intégralement réglée.",
  },
  Annulée: {
    label: "Annulée",
    icon: XCircle,
    badge: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900",
    dot: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
    desc: "Cette facture a été annulée.",
  },
};

export const STATUT_FLOW: FactureStatut[] = ["Brouillon", "Envoyée", "Partielle", "Soldée"];
export const STATUTS_ALL: FactureStatut[] = ["Brouillon", "Envoyée", "Partielle", "Soldée", "Annulée"];

// "Partielle" n'est jamais un statut cible manuel : il ne doit résulter que
// d'un paiement réel enregistré via recordFacturePaiement (montantPaye > 0),
// jamais d'un simple changement de statut sans montant associé.
export const NEXT_STATUT: Partial<Record<FactureStatut, { to: FactureStatut; label: string }>> = {
  Brouillon: { to: "Envoyée", label: "Marquer comme envoyée" },
  Partielle: { to: "Soldée", label: "Marquer comme soldée" },
};

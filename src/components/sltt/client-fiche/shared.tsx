import type { BonMotif } from "@/lib/domain-types";
import type { Tone } from "@/components/sltt/status-badge";
import {
  BookOpen,
  FolderKanban,
  Receipt,
  Warehouse,
  Truck,
} from "lucide-react";

export const PAGE_SIZE = 6;

export type FicheTab = "classeur" | "dossiers" | "factures" | "stock" | "bons";

export const FICHE_TABS: {
  key: FicheTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "classeur", label: "Classeur", shortLabel: "Classeur", icon: BookOpen },
  { key: "dossiers", label: "Dossiers", shortLabel: "Dossiers", icon: FolderKanban },
  { key: "factures", label: "Factures", shortLabel: "Factures", icon: Receipt },
  { key: "stock", label: "Stock", shortLabel: "Stock", icon: Warehouse },
  { key: "bons", label: "Bons de sortie", shortLabel: "Bons", icon: Truck },
];

export function avatarGradient(type: "Entreprise" | "Particulier"): string {
  return type === "Entreprise"
    ? "from-blue-600 to-indigo-700"
    : "from-slate-600 to-slate-800";
}

export const BON_MOTIF_TONE: Record<BonMotif, "blue" | "emerald" | "indigo"> = {
  Vente: "blue",
  Livraison: "emerald",
  Transfert: "indigo",
};

export function bonStatutTone(statut: "Validé" | "Brouillon"): "emerald" | "amber" {
  return statut === "Validé" ? "emerald" : "amber";
}

const CLASSEUR_STATUT_TONE: Record<string, Tone> = {
  "En cours": "blue",
  "Dédouané": "indigo",
  "Livré": "blue",
  "Soldé": "emerald",
  "Soldée": "emerald",
  "En attente": "amber",
  "Brouillon": "slate",
  "Envoyée": "blue",
  "Partielle": "amber",
  "Annulée": "red",
};

export function classeurStatutTone(statut: string): Tone {
  return CLASSEUR_STATUT_TONE[statut] ?? "slate";
}

export function TabEmptyState({
  label,
  action,
}: {
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

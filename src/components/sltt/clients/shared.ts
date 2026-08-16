import type { ClientType } from "@/lib/domain-types";

export const CLIENT_TYPES = ["Entreprise", "Particulier"] as const satisfies readonly ClientType[];

export type ClientSortKey = "nom" | "totalDu" | "nbDossiers";

export type ClientTypeFilter = "all" | ClientType;

export const SORT_OPTIONS: { value: ClientSortKey; label: string; headerLabel: string }[] = [
  { value: "nom", label: "Nom (A → Z)", headerLabel: "Client" },
  { value: "totalDu", label: "Créance (décroissant)", headerLabel: "Total dû" },
  { value: "nbDossiers", label: "Nb dossiers (décroissant)", headerLabel: "Dossiers" },
];

export function avatarGradient(type: ClientType): string {
  return type === "Entreprise"
    ? "from-blue-600 to-indigo-700"
    : "from-slate-600 to-slate-800";
}

export function rowAccentClass(type: ClientType): string {
  return type === "Entreprise"
    ? "border-l-2 border-l-blue-400/60 dark:border-l-blue-500/50"
    : "border-l-2 border-l-slate-300/70 dark:border-l-slate-600/60";
}

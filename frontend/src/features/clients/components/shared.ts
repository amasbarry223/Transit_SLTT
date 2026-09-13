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
    ? "from-[#1344C8] to-[#0B2A78]"
    : "from-[#2563EB] to-[#1D4ED8]";
}

export function rowAccentClass(type: ClientType): string {
  return type === "Entreprise"
    ? "border-l-2 border-l-[#1344C8]/80 dark:border-l-blue-400"
    : "border-l-2 border-l-[#2563EB]/60 dark:border-l-blue-500";
}

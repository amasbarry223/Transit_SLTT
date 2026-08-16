import type { FactureStatut } from "@/lib/store";

export const PAGE_SIZE = 8;

export const FACTURE_TABS: Array<{ key: FactureStatut | "Tous"; label: string }> = [
  { key: "Tous", label: "Toutes" },
  { key: "Brouillon", label: "Brouillon" },
  { key: "Envoyée", label: "Envoyées" },
  { key: "Partielle", label: "Partielles" },
  { key: "Soldée", label: "Soldées" },
  { key: "Annulée", label: "Annulées" },
];

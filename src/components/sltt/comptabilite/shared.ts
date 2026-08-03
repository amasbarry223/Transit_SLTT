import type { ComponentType } from "react";
import { ArrowLeftRight, Banknote, CreditCard, Smartphone } from "lucide-react";
import type { Ecriture, PaiementMode } from "@/lib/store";
import { resteAPayer } from "@/lib/domain-types";

export const PAGE_SIZE = 8;

export type StatutFilter = "all" | "En attente" | "Soldé";

export const modeIcon: Record<
  PaiementMode,
  ComponentType<{ className?: string }>
> = {
  Espèces: Banknote,
  Virement: ArrowLeftRight,
  "Mobile Money": Smartphone,
  Chèque: CreditCard,
};

export const modeOptions: PaiementMode[] = [
  "Espèces",
  "Virement",
  "Mobile Money",
  "Chèque",
];

export function deriveStatut(ecriture: Ecriture): "Soldé" | "En attente" {
  return resteAPayer(ecriture) === 0 ? "Soldé" : "En attente";
}

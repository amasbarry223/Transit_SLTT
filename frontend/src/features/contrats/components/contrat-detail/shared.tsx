import type { ContratPrestationStatut, ContratStatut } from "@/lib/store";
import type { PaiementMode } from "@/lib/domain-types";

export const CONTRAT_STATUTS: ContratStatut[] = ["En cours", "Exécuté"];
export const CONTRAT_STATUT_TONE: Record<ContratStatut, "blue" | "emerald" | "slate" | "amber"> = {
  "En cours": "blue",
  "Exécuté": "emerald",
  Actif: "emerald",
  Clôturé: "slate",
  Suspendu: "amber",
};
export const PRESTATION_STATUTS: ContratPrestationStatut[] = ["En attente", "Exécuté"];
export const PRESTATION_STATUT_TONE: Record<ContratPrestationStatut, "amber" | "emerald" | "blue" | "red"> = {
  "En attente": "amber",
  "Exécuté": "emerald",
  Prévue: "blue",
  Réalisée: "emerald",
  Annulée: "red",
};
export const MODES_PAIEMENT: PaiementMode[] = ["Espèces", "Virement", "Mobile Money", "Chèque"];

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  );
}

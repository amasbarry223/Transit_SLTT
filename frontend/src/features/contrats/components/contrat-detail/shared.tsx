import type { ContratPrestationStatut, ContratStatut } from "@/lib/store";
import type { PaiementMode } from "@/lib/domain-types";

// Les 5 valeurs coexistent dans le modèle métier (voir CONTRAT_ALLOWED_TRANSITIONS
// et le même tableau côté backend, contrats.service.ts::STATUT_TRANSITIONS, qui
// autorise des transitions entre TOUTES ces valeurs, ex. Clôturé -> En cours).
// Un refactor précédent avait réduit ce tableau à ["En cours", "Exécuté"] au lieu
// de l'étendre : plus aucun contrat ne pouvait être clôturé/suspendu depuis l'UI,
// et les contrats déjà dans ces statuts n'avaient plus aucune issue.
export const CONTRAT_STATUTS: ContratStatut[] = ["En cours", "Exécuté", "Actif", "Suspendu", "Clôturé"];
export const CONTRAT_STATUT_TONE: Record<ContratStatut, "blue" | "emerald" | "slate" | "amber"> = {
  "En cours": "blue",
  "Exécuté": "emerald",
  Actif: "emerald",
  Clôturé: "slate",
  Suspendu: "amber",
};
// Même correctif que CONTRAT_STATUTS ci-dessus : "Réalisée" doit rester
// sélectionnable, c'est la condition du bouton "Facturer" une prestation
// optionnelle (contrat-detail-screen.tsx).
export const PRESTATION_STATUTS: ContratPrestationStatut[] = ["En attente", "Exécuté", "Prévue", "Réalisée", "Annulée"];
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

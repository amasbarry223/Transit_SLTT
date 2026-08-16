import type { ContratInput, ContratPrestationStatut, ContratStatut } from "@/lib/store";
import type { PaiementMode } from "@/lib/domain-types";

export const CONTRAT_STATUTS: ContratStatut[] = ["Actif", "Clôturé", "Suspendu"];
export const CONTRAT_STATUT_TONE: Record<ContratStatut, "emerald" | "slate" | "amber"> = {
  Actif: "emerald",
  Clôturé: "slate",
  Suspendu: "amber",
};
export const PRESTATION_STATUTS: ContratPrestationStatut[] = ["Prévue", "Réalisée", "Annulée"];
export const PRESTATION_STATUT_TONE: Record<ContratPrestationStatut, "blue" | "emerald" | "red"> = {
  Prévue: "blue",
  Réalisée: "emerald",
  Annulée: "red",
};
export const MODES_PAIEMENT: PaiementMode[] = ["Espèces", "Virement", "Mobile Money", "Chèque"];

export function contratToInput(contrat: {
  societeId: string;
  clientId: string;
  clientNom: string;
  annexeId: string;
  objet: string;
  dateDebut: string;
  dateFin?: string;
  montant: number;
  statut: ContratStatut;
  notes?: string;
}): ContratInput {
  return {
    societeId: contrat.societeId,
    clientId: contrat.clientId,
    clientNom: contrat.clientNom,
    annexeId: contrat.annexeId,
    objet: contrat.objet,
    dateDebut: contrat.dateDebut,
    dateFin: contrat.dateFin,
    montant: contrat.montant,
    statut: contrat.statut,
    notes: contrat.notes,
  };
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  );
}

import type { DevisRow } from "@/lib/db-rows";
import type { Devis } from "@/features/devis/types";

export function mapDevisFromDb(row: DevisRow): Devis {
  return {
    id: row.id,
    reference: row.reference,
    clientId: row.client_id,
    clientNom: row.clients?.nom || "—",
    societeId: row.societe_id,
    societeNom: row.societes?.nom || "—",
    annexeId: row.annexe_id,
    annexeNom: row.annexes?.nom,
    nature: row.nature,
    droitDouane: Number(row.droit_douane),
    fraisCircuit: Number(row.frais_circuit),
    fraisPrestation: Number(row.frais_prestation),
    total: Number(row.total),
    statut: row.statut,
    dateCreation: row.date_creation,
    dateValidite: row.date_validite,
    notes: row.notes || undefined,
    dossierId: row.dossier_id ?? undefined,
  };
}

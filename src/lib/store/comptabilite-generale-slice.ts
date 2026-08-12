import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import { getConnectedUserName } from "@/lib/store/connected-user";
import type {
  ClotureCaisse,
  EntiteComptableType,
  OperationComptable,
  OperationComptableInput,
} from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import type { ClotureCaisseRow, OperationComptableRow } from "@/lib/db-rows";

export function mapOperationComptableFromDb(row: OperationComptableRow): OperationComptable {
  return {
    id: row.id,
    reference: row.reference,
    entiteType: row.entite_type,
    annexeId: row.annexe_id || undefined,
    societeId: row.societe_id || undefined,
    date: row.date,
    clientId: row.client_id || undefined,
    clientNom: row.client_nom,
    nature: row.nature,
    type: row.type,
    montant: Number(row.montant || 0),
    quantite: row.quantite != null ? Number(row.quantite) : undefined,
    prixUnitaire: row.prix_unitaire != null ? Number(row.prix_unitaire) : undefined,
    source: row.source,
    importRef: row.import_ref || undefined,
    creePar: row.cree_par || undefined,
  };
}

export function mapClotureCaisseFromDb(row: ClotureCaisseRow): ClotureCaisse {
  return {
    id: row.id,
    entiteType: row.entite_type,
    annexeId: row.annexe_id || undefined,
    societeId: row.societe_id || undefined,
    periodeDebut: row.periode_debut,
    periodeFin: row.periode_fin,
    soldeTheorique: Number(row.solde_theorique || 0),
    soldeConstate: Number(row.solde_constate || 0),
    ecart: Number(row.ecart || 0),
    note: row.note || undefined,
    cloturePar: row.cloture_par || undefined,
    clotureLe: row.cloture_le,
  };
}

export interface RecordClotureCaisseInput {
  entiteType: EntiteComptableType;
  annexeId?: string;
  societeId?: string;
  periodeDebut: string;
  periodeFin: string;
  soldeTheorique: number;
  soldeConstate: number;
  note?: string;
}

export interface ComptabiliteGeneraleSlice {
  operationsComptables: OperationComptable[];
  cloturesCaisse: ClotureCaisse[];
  operationComptableSeq: number;
  addOperationComptable: (input: OperationComptableInput) => Promise<OperationComptable>;
  removeOperationComptable: (id: string) => Promise<void>;
  recordClotureCaisse: (input: RecordClotureCaisseInput) => Promise<ClotureCaisse>;
}

export const createComptabiliteGeneraleSlice: StateCreator<
  SLTTState,
  [],
  [],
  ComptabiliteGeneraleSlice
> = (set, get) => ({
  operationsComptables: [],
  cloturesCaisse: [],
  operationComptableSeq: 1,

  addOperationComptable: async (input) => {
    const seq = get().operationComptableSeq;
    const reference = `OPC-${seq}`;
    const creePar = getConnectedUserName();

    const { data, error } = await supabase
      .from("operations_comptables")
      .insert({
        reference,
        entite_type: input.entiteType,
        annexe_id: input.annexeId || null,
        societe_id: input.societeId || null,
        date: input.date,
        client_id: input.clientId || null,
        client_nom: input.clientNom,
        nature: input.nature,
        type: input.type,
        montant: Math.max(0, input.montant),
        quantite: input.quantite ?? null,
        prix_unitaire: input.prixUnitaire ?? null,
        source: input.source ?? "saisie",
        import_ref: input.importRef || null,
        cree_par: creePar,
      })
      .select("*, clients(nom), societes(nom), annexes(nom)")
      .single();
    if (error) throw error;

    const newOperation = mapOperationComptableFromDb(data);
    set((s) => ({
      operationsComptables: [newOperation, ...s.operationsComptables],
      operationComptableSeq: seq + 1,
    }));

    await get().addAuditLog(
      "Comptabilité",
      "Création",
      `Opération ${reference} — ${input.type} ${input.montant.toLocaleString("fr-FR")} FCFA (${input.nature})`,
      input.clientId,
      { sourceType: "operation_comptable", sourceId: newOperation.id },
    );
    return newOperation;
  },

  removeOperationComptable: async (id) => {
    const operation = get().operationsComptables.find((o) => o.id === id);
    const { error } = await supabase.from("operations_comptables").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ operationsComptables: s.operationsComptables.filter((o) => o.id !== id) }));
    if (operation) {
      await get().addAuditLog(
        "Comptabilité",
        "Suppression",
        `Opération ${operation.reference} supprimée`,
        operation.clientId,
        { sourceType: "operation_comptable", sourceId: id },
      );
    }
  },

  recordClotureCaisse: async (input) => {
    const { data, error } = await supabase.rpc("record_cloture_caisse", {
      p_entite_type: input.entiteType,
      p_periode_debut: input.periodeDebut,
      p_periode_fin: input.periodeFin,
      p_solde_theorique: input.soldeTheorique,
      p_solde_constate: input.soldeConstate,
      p_annexe_id: input.annexeId || null,
      p_societe_id: input.societeId || null,
      p_note: input.note || null,
    });
    if (error) throw error;
    const cloture = mapClotureCaisseFromDb(data as ClotureCaisseRow);

    set((s) => ({
      cloturesCaisse: [
        cloture,
        ...s.cloturesCaisse.filter(
          (c) =>
            !(
              c.entiteType === cloture.entiteType &&
              c.annexeId === cloture.annexeId &&
              c.societeId === cloture.societeId &&
              c.periodeFin === cloture.periodeFin
            ),
        ),
      ],
    }));

    await get().addAuditLog(
      "Comptabilité",
      "Validation",
      `Clôture de caisse ${input.periodeDebut} → ${input.periodeFin} — écart ${cloture.ecart.toLocaleString("fr-FR")} FCFA`,
      undefined,
      { sourceType: "cloture_caisse", sourceId: cloture.id },
    );
    return cloture;
  },
});

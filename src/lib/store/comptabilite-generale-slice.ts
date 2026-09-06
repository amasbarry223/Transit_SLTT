import type { StateCreator } from "zustand";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getConnectedUserName } from "@/lib/store/connected-user";
import type {
  ClotureCaisse,
  EntiteComptableType,
  OperationComptable,
  OperationComptableInput,
} from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import type { ClotureCaisseRow, OperationComptableRow } from "@/lib/db-rows";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";
import { extractTrailingSeq, insertWithReferenceRetry } from "@/lib/store/reference";

export function mapOperationComptableFromDb(row: OperationComptableRow): OperationComptable {
  return {
    id: row.id,
    reference: row.reference,
    entiteType: "annexe",
    annexeId: row.annexe_id || undefined,
    date: row.date,
    clientId: row.client_id || undefined,
    dossierId: row.dossier_id || undefined,
    dossierRef: row.dossiers?.reference || undefined,
    clientNom: row.client_nom,
    nature: row.nature,
    type: row.type,
    montant: Number(row.montant || 0),
    modePaiement: (row.mode_paiement as OperationComptable["modePaiement"]) || "Espèces",
    source: row.source,
    importRef: row.import_ref || undefined,
    creePar: row.cree_par || undefined,
  };
}

export function mapClotureCaisseFromDb(row: ClotureCaisseRow): ClotureCaisse {
  return {
    id: row.id,
    entiteType: "annexe",
    annexeId: row.annexe_id || undefined,
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
    if (!(input.montant > 0)) {
      throw new Error("Le montant de l'opération doit être supérieur à 0.");
    }
    const seq = get().operationComptableSeq;
    const initialReference = `OPC-${seq}`;
    const creePar = getConnectedUserName();

    if (!isSupabaseConfigured) {
      const newOperation: OperationComptable = {
        id: crypto.randomUUID(),
        reference: initialReference,
        entiteType: "annexe",
        annexeId: input.annexeId,
        date: input.date,
        clientId: input.clientId,
        dossierId: input.dossierId,
        clientNom: input.clientNom,
        nature: input.nature,
        type: input.type,
        montant: input.montant,
        modePaiement: input.modePaiement ?? "Espèces",
        source: input.source ?? "saisie",
        importRef: input.importRef,
        creePar,
      };

      set((s) => ({
        operationsComptables: [newOperation, ...s.operationsComptables],
        operationComptableSeq: seq + 1,
      }));

      await get().addAuditLog(
        AUDIT_MODULE.Comptabilite,
        AUDIT_ACTION.Creation,
        `Opération ${initialReference} — ${input.type} ${input.montant.toLocaleString("fr-FR")} FCFA (${input.nature})`,
        input.clientId,
        { sourceType: "operation_comptable", sourceId: newOperation.id },
      );
      return newOperation;
    }

    const { data, reference } = await insertWithReferenceRetry<OperationComptableRow>(
      initialReference,
      (ref) =>
        supabase
          .from("operations_comptables")
          .insert({
            reference: ref,
            annexe_id: input.annexeId || null,
            date: input.date,
            client_id: input.clientId || null,
            dossier_id: input.dossierId || null,
            client_nom: input.clientNom,
            nature: input.nature,
            type: input.type,
            montant: input.montant,
            mode_paiement: input.modePaiement ?? "Espèces",
            source: input.source ?? "saisie",
            import_ref: input.importRef || null,
            cree_par: creePar,
          })
          .select("*, clients(nom), annexes(nom)")
          .single(),
    );

    const newOperation = mapOperationComptableFromDb(data);
    const finalSeq = extractTrailingSeq(reference) ?? seq;
    set((s) => ({
      operationsComptables: [newOperation, ...s.operationsComptables],
      operationComptableSeq: finalSeq + 1,
    }));

    await get().addAuditLog(
      AUDIT_MODULE.Comptabilite,
      AUDIT_ACTION.Creation,
      `Opération ${reference} — ${input.type} ${input.montant.toLocaleString("fr-FR")} FCFA (${input.nature})`,
      input.clientId,
      { sourceType: "operation_comptable", sourceId: newOperation.id },
    );
    return newOperation;
  },

  removeOperationComptable: async (id) => {
    const operation = get().operationsComptables.find((o) => o.id === id);
    if (isSupabaseConfigured) {
      const { error } = await supabase.from("operations_comptables").delete().eq("id", id);
      if (error) throw error;
    }
    set((s) => ({ operationsComptables: s.operationsComptables.filter((o) => o.id !== id) }));
    if (operation) {
      await get().addAuditLog(
        AUDIT_MODULE.Comptabilite,
        AUDIT_ACTION.Suppression,
        `Opération ${operation.reference} supprimée`,
        operation.clientId,
        { sourceType: "operation_comptable", sourceId: id },
      );
    }
  },

  recordClotureCaisse: async (input) => {
    if (!isSupabaseConfigured) {
      const ecart = input.soldeConstate - input.soldeTheorique;
      const cloture: ClotureCaisse = {
        id: crypto.randomUUID(),
        entiteType: "annexe",
        annexeId: input.annexeId,
        periodeDebut: input.periodeDebut,
        periodeFin: input.periodeFin,
        soldeTheorique: input.soldeTheorique,
        soldeConstate: input.soldeConstate,
        ecart,
        note: input.note,
        cloturePar: getConnectedUserName(),
        clotureLe: new Date().toISOString(),
      };

      set((s) => ({
        cloturesCaisse: [
          cloture,
          ...s.cloturesCaisse.filter(
            (c) =>
              !(
                c.entiteType === cloture.entiteType &&
                c.annexeId === cloture.annexeId &&
                c.periodeFin === cloture.periodeFin
              ),
          ),
        ],
      }));

      await get().addAuditLog(
        AUDIT_MODULE.Comptabilite,
        AUDIT_ACTION.Validation,
        `Clôture de caisse ${input.periodeDebut} → ${input.periodeFin} — écart ${cloture.ecart.toLocaleString("fr-FR")} FCFA`,
        undefined,
        { sourceType: "cloture_caisse", sourceId: cloture.id },
      );
      return cloture;
    }

    const { data, error } = await supabase.rpc("record_cloture_caisse", {
      p_annexe_id: input.annexeId || null,
      p_periode_debut: input.periodeDebut,
      p_periode_fin: input.periodeFin,
      p_solde_theorique: input.soldeTheorique,
      p_solde_constate: input.soldeConstate,
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
              c.periodeFin === cloture.periodeFin
            ),
        ),
      ],
    }));

    await get().addAuditLog(
      AUDIT_MODULE.Comptabilite,
      AUDIT_ACTION.Validation,
      `Clôture de caisse ${input.periodeDebut} → ${input.periodeFin} — écart ${cloture.ecart.toLocaleString("fr-FR")} FCFA`,
      undefined,
      { sourceType: "cloture_caisse", sourceId: cloture.id },
    );
    return cloture;
  },
});


import { logWarn } from "@/shared/logger";
import type { StateCreator } from "zustand";
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

import { api } from "@/lib/api-client";

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

    let dbId = crypto.randomUUID();
    try {
      const created = await api.comptabilite.createOperation({
        reference: initialReference,
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
      });
      if (created?.id) dbId = created.id;
    } catch (e) {
      logWarn("api.comptabilite.createOperation (mode local)", e);
    }

    const newOperation: OperationComptable = {
      id: dbId,
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
  },

  removeOperationComptable: async (id) => {
    try {
      await api.comptabilite.deleteOperation(id);
    } catch (e) {
      logWarn("api.comptabilite.deleteOperation (mode local)", e);
    }

    const operation = get().operationsComptables.find((o) => o.id === id);
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
    const ecart = input.soldeConstate - input.soldeTheorique;
    const creeLe = new Date().toISOString();
    const cloturePar = getConnectedUserName();

    let dbId = crypto.randomUUID();
    try {
      const created = await api.comptabilite.createCloture({
        annexeId: input.annexeId,
        periodeDebut: input.periodeDebut,
        periodeFin: input.periodeFin,
        soldeTheorique: input.soldeTheorique,
        soldeConstate: input.soldeConstate,
        note: input.note,
        cloturePar,
        clotureLe: creeLe,
      });
      if (created?.id) dbId = created.id;
    } catch (e) {
      logWarn("api.comptabilite.createCloture (mode local)", e);
    }

    const cloture: ClotureCaisse = {
      id: dbId,
      entiteType: "annexe",
      annexeId: input.annexeId,
      periodeDebut: input.periodeDebut,
      periodeFin: input.periodeFin,
      soldeTheorique: input.soldeTheorique,
      soldeConstate: input.soldeConstate,
      ecart,
      note: input.note,
      cloturePar,
      clotureLe: creeLe,
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
  },
});


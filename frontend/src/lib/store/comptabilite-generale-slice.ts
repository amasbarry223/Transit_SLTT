import type { StateCreator } from "zustand";
import { getConnectedUserName } from "@/lib/store/connected-user";
import type {
  ClotureCaisse,
  EntiteComptableType,
  OperationComptable,
  OperationComptableInput,
} from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

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

    // Persistance obligatoire : une opération sans écriture serveur
    // disparaissait silencieusement au rechargement, sans aucune erreur
    // montrée à l'utilisateur.
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

    const newOperation: OperationComptable = {
      id: created?.id ?? crypto.randomUUID(),
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
    await api.comptabilite.deleteOperation(id);

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

    // Persistance obligatoire — voir addOperationComptable ci-dessus.
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

    const cloture: ClotureCaisse = {
      id: created?.id ?? crypto.randomUUID(),
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


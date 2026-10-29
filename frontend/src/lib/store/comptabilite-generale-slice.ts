import type { StateCreator } from "zustand";
import { getConnectedUserName } from "@/lib/store/connected-user";
import type {
  ClotureCaisse,
  EntiteComptableType,
  ModePaiement,
  OperationComptable,
  OperationComptableInput,
  OperationComptableSource,
  OperationComptableType,
} from "@/lib/domain-types";
import type { RawOperationComptable } from "@/lib/api-types";
import { logWarn } from "@/shared/logger";
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
  /** Recharge le journal (écritures générées par le serveur après un règlement, une dépense…). Ne lève jamais. */
  refreshOperationsComptables: () => Promise<void>;
  removeOperationComptable: (id: string) => Promise<void>;
  recordClotureCaisse: (input: RecordClotureCaisseInput) => Promise<ClotureCaisse>;
}

import { api } from "@/lib/api-client";

export function mapOperationComptable(o: RawOperationComptable): OperationComptable {
  return {
    id: o.id,
    reference: o.reference || "",
    entiteType: "annexe",
    annexeId: o.annexeId || undefined,
    date: o.date || "",
    clientId: o.clientId || undefined,
    dossierId: o.dossierId || undefined,
    clientNom: o.clientNom || "",
    nature: o.nature || "",
    type: (o.type || "Entrée") as OperationComptableType,
    montant: Number(o.montant || 0),
    modePaiement: (o.modePaiement || "Espèces") as ModePaiement,
    source: (o.source || "saisie") as OperationComptableSource,
    importRef: o.importRef || undefined,
    creePar: o.creePar || undefined,
  };
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
    // Même garde-fou que addDossier/addBonSortieCaisse contre deux créations
    // proches calculant la même référence à partir d'un compteur lu avant l'`await`.
    let seq = get().operationComptableSeq;
    while (get().operationsComptables.some((o) => o.reference === `OPC-${seq}`)) {
      seq++;
    }
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

    // Le serveur tranche la référence (compteur persistant, collisions
    // gérées) : on affiche celle qu'il a attribuée, pas notre proposition.
    const reference = created?.reference ?? initialReference;
    const newOperation: OperationComptable = {
      id: created?.id ?? crypto.randomUUID(),
      reference,
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
      operationComptableSeq: Math.max(s.operationComptableSeq, seq + 1),
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

  refreshOperationsComptables: async () => {
    try {
      const raw = await api.comptabilite.getOperations();
      if (Array.isArray(raw)) set({ operationsComptables: raw.map(mapOperationComptable) });
    } catch (error) {
      logWarn("Rechargement du journal comptable impossible", error);
    }
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

    // Le serveur recalcule le théorique (report + net de la période) et fait
    // foi ; les valeurs saisies côté client ne servent que de repli d'affichage.
    const soldeTheorique = created?.soldeTheorique ?? input.soldeTheorique;
    const ecart = created?.ecart ?? input.soldeConstate - soldeTheorique;

    const cloture: ClotureCaisse = {
      id: created?.id ?? crypto.randomUUID(),
      // Avant : toujours "annexe" en dur, même pour une clôture "société"
      // (entite.type === "societe", cf. cloture-dialog.tsx) — le filtre de
      // déduplication ci-dessous et tout écran filtrant cloturesCaisse par
      // entiteType ne retrouvaient alors jamais les clôtures société,
      // toujours mal étiquetées "annexe" dans l'état local.
      entiteType: input.entiteType,
      annexeId: input.annexeId,
      periodeDebut: input.periodeDebut,
      periodeFin: input.periodeFin,
      soldeTheorique,
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


import type { StateCreator } from "zustand";
import { syncClientStats } from "@/lib/client-stats";
import { DEFAULT_PAIEMENT_MODE } from "@/lib/constants";
import type { Ecriture, PaiementMode } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import type { EcritureRow } from "@/lib/db-rows";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

export function mapEcritureFromDb(row: EcritureRow): Ecriture {
  return {
    id: row.id,
    date: row.date,
    datePaiement: row.date_paiement || undefined,
    clientId: row.client_id,
    clientNom: row.clients?.nom || "",
    dossierId: row.dossier_id || undefined,
    annexeId: row.annexe_id,
    annexeNom: row.annexes?.nom,
    montantInvesti: Number(row.montant_investi || 0),
    montantPaye: Number(row.montant_paye || 0),
    modePaiement: row.mode_paiement || DEFAULT_PAIEMENT_MODE,
    note: row.note || undefined,
  };
}

export interface EcrituresSlice {
  ecritures: Ecriture[];
  recordPayment: (
    ecritureId: string,
    montant: number,
    mode: PaiementMode,
    date: string,
    note: string,
  ) => Promise<void>;
  addEcriture: (input: Omit<Ecriture, "id">) => Promise<Ecriture>;
  patchEcriture: (
    id: string,
    patch: { note?: string; montantInvesti?: number; montantPaye?: number },
  ) => Promise<void>;
  /** Patch montants / libellé dossier (classeur éditable). */
  patchDossierClasseur: (
    id: string,
    patch: { montantInvesti?: number; montantPaye?: number; nature?: string; bl?: string },
  ) => Promise<void>;
}

export const createEcrituresSlice: StateCreator<SLTTState, [], [], EcrituresSlice> = (set, get) => ({
  ecritures: [],

  recordPayment: async (ecritureId, montant, mode, date, note) => {
    const ecriture = get().ecritures.find((item) => item.id === ecritureId);
    if (!ecriture) return;

    const newPaye = ecriture.montantPaye + montant;
    set((s) => {
      const updatedEcritures = s.ecritures.map((item) =>
        item.id === ecritureId
          ? {
              ...item,
              montantPaye: newPaye,
              modePaiement: mode,
              datePaiement: date,
              note: note || item.note,
            }
          : item,
      );
      let updatedDossiers = s.dossiers;
      if (ecriture.dossierId) {
        const sumPaye = updatedEcritures
          .filter((item) => item.dossierId === ecriture.dossierId)
          .reduce((sum, item) => sum + item.montantPaye, 0);
        updatedDossiers = s.dossiers.map((dossier) =>
          dossier.id === ecriture.dossierId ? { ...dossier, montantPaye: sumPaye } : dossier,
        );
      }
      return {
        ecritures: updatedEcritures,
        dossiers: updatedDossiers,
        clients: syncClientStats(updatedDossiers, s.factures, updatedEcritures, s.clients),
      };
    });

    await get().addAuditLog(
      AUDIT_MODULE.Comptabilite,
      AUDIT_ACTION.Paiement,
      `Paiement ${montant.toLocaleString("fr-FR")} FCFA — Écriture ${ecritureId}`,
      ecriture.clientId,
      { sourceType: "ecriture", sourceId: ecritureId },
    );
  },

  addEcriture: async (input) => {
    const seq = get().ecritureSeq;
    const validatedPaye = Math.max(0, input.montantPaye);

    const newEcriture: Ecriture = {
      id: crypto.randomUUID(),
      date: input.date,
      datePaiement: input.datePaiement,
      clientId: input.clientId,
      clientNom: input.clientNom,
      dossierId: input.dossierId,
      annexeId: input.annexeId,
      annexeNom: get().annexes.find((a) => a.id === input.annexeId)?.nom,
      montantInvesti: input.montantInvesti,
      montantPaye: validatedPaye,
      modePaiement: input.modePaiement,
      note: input.note,
    };

    set((s) => {
      const updatedEcritures = [newEcriture, ...s.ecritures];
      let updatedDossiers = s.dossiers;
      if (input.dossierId) {
        const sumPaye = updatedEcritures
          .filter((item) => item.dossierId === input.dossierId)
          .reduce((sum, item) => sum + item.montantPaye, 0);
        updatedDossiers = s.dossiers.map((dossier) =>
          dossier.id === input.dossierId ? { ...dossier, montantPaye: sumPaye } : dossier,
        );
      }
      return {
        ecritures: updatedEcritures,
        ecritureSeq: seq + 1,
        dossiers: updatedDossiers,
        clients: syncClientStats(updatedDossiers, s.factures, updatedEcritures, s.clients),
      };
    });

    await get().addAuditLog(
      AUDIT_MODULE.Comptabilite,
      AUDIT_ACTION.Creation,
      `Écriture créée pour ${input.clientNom}`,
      input.clientId,
      { sourceType: "ecriture", sourceId: newEcriture.id },
    );
    return newEcriture;
  },

  patchEcriture: async (id, patch) => {
    const existing = get().ecritures.find((ecriture) => ecriture.id === id);
    if (!existing) throw new Error("Écriture introuvable");

    set((s) => {
      const updatedEcritures = s.ecritures.map((ecriture) =>
        ecriture.id === id
          ? {
              ...ecriture,
              note: patch.note ?? ecriture.note,
              montantInvesti: patch.montantInvesti !== undefined ? Math.max(0, patch.montantInvesti) : ecriture.montantInvesti,
              montantPaye: patch.montantPaye !== undefined ? Math.max(0, patch.montantPaye) : ecriture.montantPaye,
            }
          : ecriture,
      );
      let updatedDossiers = s.dossiers;
      if (existing.dossierId && patch.montantPaye !== undefined) {
        const sumPaye = updatedEcritures
          .filter((item) => item.dossierId === existing.dossierId)
          .reduce((sum, item) => sum + item.montantPaye, 0);
        updatedDossiers = s.dossiers.map((dossier) =>
          dossier.id === existing.dossierId ? { ...dossier, montantPaye: sumPaye } : dossier,
        );
      }
      return {
        ecritures: updatedEcritures,
        dossiers: updatedDossiers,
        clients: syncClientStats(updatedDossiers, s.factures, updatedEcritures, s.clients),
      };
    });

    await get().addAuditLog(
      AUDIT_MODULE.Comptabilite,
      AUDIT_ACTION.Modification,
      `Écriture ${id.slice(0, 8)} modifiée (classeur)`,
      existing.clientId,
      { sourceType: "ecriture", sourceId: id },
    );
  },

  patchDossierClasseur: async (id, patch) => {
    const existing = get().dossiers.find((dossier) => dossier.id === id);
    if (!existing) throw new Error("Dossier introuvable");

    let syncedMontantPaye = patch.montantPaye ?? existing.montantPaye;
    let updatedEcritures = get().ecritures;
    if (patch.montantPaye !== undefined) {
      const targetPaye = Math.max(0, patch.montantPaye);
      const linked = get().ecritures.filter((ecriture) => ecriture.dossierId === id);
      if (linked.length > 0) {
        const firstId = linked[0].id;
        const linkedIds = new Set(linked.map((ecriture) => ecriture.id));
        updatedEcritures = get().ecritures.map((ecriture) => {
          if (!linkedIds.has(ecriture.id)) return ecriture;
          return { ...ecriture, montantPaye: ecriture.id === firstId ? targetPaye : 0 };
        });
      }
    }

    set((s) => {
      const updatedDossiers = s.dossiers.map((dossier) =>
        dossier.id === id
          ? {
              ...dossier,
              montantInvesti: patch.montantInvesti ?? dossier.montantInvesti,
              montantPaye: syncedMontantPaye,
              nature: patch.nature ?? dossier.nature,
              bl: patch.bl ?? dossier.bl,
            }
          : dossier,
      );
      return {
        dossiers: updatedDossiers,
        ecritures: updatedEcritures,
        clients: syncClientStats(updatedDossiers, s.factures, updatedEcritures, s.clients),
      };
    });

    await get().addAuditLog(
      AUDIT_MODULE.Dossiers,
      AUDIT_ACTION.Modification,
      `Dossier ${existing.reference} modifié (classeur)`,
      existing.clientId,
      { sourceType: "dossier", sourceId: id },
    );
  },
});

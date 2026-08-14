import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import { syncClientStats } from "@/lib/client-stats";
import { DEFAULT_PAIEMENT_MODE } from "@/lib/constants";
import { syncDossierPayeFromEcritures } from "@/lib/store/sync-helpers";
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
    societeId: row.societe_id || undefined,
    societeNom: row.societes?.nom || undefined,
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

    const { data, error } = await supabase.rpc("record_ecriture_paiement", {
      p_ecriture_id: ecritureId,
      p_montant: montant,
      p_mode: mode,
      p_date: date,
      p_note: note || null,
    });
    if (error) throw error;
    const row = data as {
      montant_paye: number;
      mode_paiement: string;
      date_paiement: string;
      note: string | null;
      dossier_id: string | null;
    };

    set((s) => {
      const updatedEcritures = s.ecritures.map((item) =>
        item.id === ecritureId
          ? {
              ...item,
              montantPaye: Number(row.montant_paye),
              modePaiement: (row.mode_paiement || mode) as typeof item.modePaiement,
              datePaiement: row.date_paiement || date,
              note: row.note || note || item.note,
            }
          : item,
      );
      let updatedDossiers = s.dossiers;
      if (row.dossier_id) {
        const sumPaye = updatedEcritures
          .filter((item) => item.dossierId === row.dossier_id)
          .reduce((sum, item) => sum + item.montantPaye, 0);
        updatedDossiers = s.dossiers.map((dossier) =>
          dossier.id === row.dossier_id ? { ...dossier, montantPaye: sumPaye } : dossier,
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

    const { data, error } = await supabase
      .from("ecritures")
      .insert({
        date: input.date,
        date_paiement: input.datePaiement || null,
        client_id: input.clientId,
        dossier_id: input.dossierId || null,
        societe_id: input.societeId || null,
        annexe_id: input.annexeId,
        montant_investi: input.montantInvesti,
        montant_paye: validatedPaye,
        mode_paiement: input.modePaiement,
        note: input.note || null,
      })
      .select("*, clients(nom), societes(nom), annexes(nom)")
      .single();

    if (error) throw error;
    const newEcriture = mapEcritureFromDb(data);
    const updatedEcrituresPreview = [newEcriture, ...get().ecritures];

    let syncedMontantPaye: number | undefined;
    if (input.dossierId) {
      const dossier = get().dossiers.find((item) => item.id === input.dossierId);
      if (dossier) {
        syncedMontantPaye = await syncDossierPayeFromEcritures(
          input.dossierId,
          updatedEcrituresPreview,
          dossier,
        );
      }
    }

    set((s) => {
      const updatedEcritures = [newEcriture, ...s.ecritures];
      if (!input.dossierId) {
        return {
          ecritures: updatedEcritures,
          ecritureSeq: seq + 1,
          clients: syncClientStats(s.dossiers, s.factures, updatedEcritures, s.clients),
        };
      }
      const updatedDossiers = s.dossiers.map((dossier) =>
        dossier.id === input.dossierId
          ? { ...dossier, montantPaye: syncedMontantPaye ?? dossier.montantPaye }
          : dossier,
      );
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
    const payload: Record<string, unknown> = {};
    if (patch.note !== undefined) payload.note = patch.note;
    if (patch.montantInvesti !== undefined) payload.montant_investi = Math.max(0, patch.montantInvesti);
    if (patch.montantPaye !== undefined) payload.montant_paye = Math.max(0, patch.montantPaye);

    const { error } = await supabase.from("ecritures").update(payload).eq("id", id);
    if (error) throw error;

    const updatedEcrituresPreview = get().ecritures.map((ecriture) =>
      ecriture.id === id
        ? {
            ...ecriture,
            note: patch.note ?? ecriture.note,
            montantInvesti: patch.montantInvesti ?? ecriture.montantInvesti,
            montantPaye: patch.montantPaye ?? ecriture.montantPaye,
          }
        : ecriture,
    );

    let syncedMontantPaye: number | undefined;
    const dossierId = existing.dossierId;
    if (dossierId && patch.montantPaye !== undefined) {
      const dossier = get().dossiers.find((item) => item.id === dossierId);
      if (dossier) {
        syncedMontantPaye = await syncDossierPayeFromEcritures(
          dossierId,
          updatedEcrituresPreview,
          dossier,
        );
      }
    }

    set((s) => {
      const updatedEcritures = s.ecritures.map((ecriture) =>
        ecriture.id === id
          ? {
              ...ecriture,
              note: patch.note ?? ecriture.note,
              montantInvesti: patch.montantInvesti ?? ecriture.montantInvesti,
              montantPaye: patch.montantPaye ?? ecriture.montantPaye,
            }
          : ecriture,
      );
      if (!dossierId || syncedMontantPaye === undefined) {
        return {
          ecritures: updatedEcritures,
          clients: syncClientStats(s.dossiers, s.factures, updatedEcritures, s.clients),
        };
      }
      const updatedDossiers = s.dossiers.map((dossier) =>
        dossier.id === dossierId ? { ...dossier, montantPaye: syncedMontantPaye } : dossier,
      );
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
    const payload: Record<string, unknown> = {};
    if (patch.montantInvesti !== undefined) payload.montant_investi = Math.max(0, patch.montantInvesti);
    if (patch.nature !== undefined) payload.nature = patch.nature;
    if (patch.bl !== undefined) payload.bl = patch.bl;

    let syncedMontantPaye: number | undefined;
    let updatedEcrituresPreview = get().ecritures;
    if (patch.montantPaye !== undefined) {
      const targetPaye = Math.max(0, patch.montantPaye);
      const linked = get().ecritures.filter((ecriture) => ecriture.dossierId === id);
      if (linked.length > 0) {
        // Chaque écriture liée cible un id distinct — les updates sont
        // indépendants entre eux, donc parallélisables sans risque d'ordre
        // (contrairement à un upsert groupé, ça garde exactement la même
        // policy RLS UPDATE que l'appel séquentiel d'origine).
        const updateResults = await Promise.all(
          linked.map((ecriture, i) =>
            supabase
              .from("ecritures")
              .update({ montant_paye: i === 0 ? targetPaye : 0 })
              .eq("id", ecriture.id),
          ),
        );
        const failedUpdate = updateResults.find((result) => result.error);
        if (failedUpdate?.error) throw failedUpdate.error;
        const firstId = linked[0].id;
        const linkedIds = new Set(linked.map((ecriture) => ecriture.id));
        updatedEcrituresPreview = get().ecritures.map((ecriture) => {
          if (!linkedIds.has(ecriture.id)) return ecriture;
          return { ...ecriture, montantPaye: ecriture.id === firstId ? targetPaye : 0 };
        });
        syncedMontantPaye = await syncDossierPayeFromEcritures(id, updatedEcrituresPreview, {
          montantInvesti:
            patch.montantInvesti !== undefined
              ? Math.max(0, patch.montantInvesti)
              : existing.montantInvesti,
        });
      } else {
        payload.montant_paye = targetPaye;
        syncedMontantPaye = targetPaye;
      }
    }

    if (Object.keys(payload).length > 0) {
      const { error } = await supabase.from("dossiers").update(payload).eq("id", id);
      if (error) throw error;
    }

    set((s) => {
      const updatedDossiers = s.dossiers.map((dossier) =>
        dossier.id === id
          ? {
              ...dossier,
              montantInvesti: patch.montantInvesti ?? dossier.montantInvesti,
              montantPaye: syncedMontantPaye ?? patch.montantPaye ?? dossier.montantPaye,
              nature: patch.nature ?? dossier.nature,
              bl: patch.bl ?? dossier.bl,
            }
          : dossier,
      );
      return {
        dossiers: updatedDossiers,
        ecritures: updatedEcrituresPreview,
        clients: syncClientStats(updatedDossiers, s.factures, updatedEcrituresPreview, s.clients),
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

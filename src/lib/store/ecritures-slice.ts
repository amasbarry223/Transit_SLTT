import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import { syncClientStats } from "@/lib/client-stats";
import { DEFAULT_PAIEMENT_MODE } from "@/lib/constants";
import { syncDossierPayeFromEcritures } from "@/lib/store/sync-helpers";
import type { Ecriture, PaiementMode } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import type { EcritureRow } from "@/lib/db-rows";

export function mapEcritureFromDb(x: EcritureRow): Ecriture {
  return {
    id: x.id,
    date: x.date,
    datePaiement: x.date_paiement || undefined,
    clientId: x.client_id,
    clientNom: x.clients?.nom || "",
    dossierId: x.dossier_id || undefined,
    societeId: x.societe_id || undefined,
    societeNom: x.societes?.nom || undefined,
    annexeId: x.annexe_id,
    annexeNom: x.annexes?.nom,
    montantInvesti: Number(x.montant_investi || 0),
    montantPaye: Number(x.montant_paye || 0),
    modePaiement: x.mode_paiement || DEFAULT_PAIEMENT_MODE,
    note: x.note || undefined,
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
  addEcriture: (e: Omit<Ecriture, "id">) => Promise<Ecriture>;
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
    const ecriture = get().ecritures.find((e) => e.id === ecritureId);
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
      const updatedEcritures = s.ecritures.map((e) =>
        e.id === ecritureId
          ? {
              ...e,
              montantPaye: Number(row.montant_paye),
              modePaiement: (row.mode_paiement || mode) as typeof e.modePaiement,
              datePaiement: row.date_paiement || date,
              note: row.note || note || e.note,
            }
          : e,
      );
      let updatedDossiers = s.dossiers;
      if (row.dossier_id) {
        const sumPaye = updatedEcritures
          .filter((e) => e.dossierId === row.dossier_id)
          .reduce((acc, e) => acc + e.montantPaye, 0);
        updatedDossiers = s.dossiers.map((d) =>
          d.id === row.dossier_id ? { ...d, montantPaye: sumPaye } : d,
        );
      }
      return {
        ecritures: updatedEcritures,
        dossiers: updatedDossiers,
        clients: syncClientStats(updatedDossiers, s.factures, updatedEcritures, s.clients),
      };
    });

    await get().addAuditLog(
      "Comptabilité",
      "Paiement",
      `Paiement ${montant.toLocaleString("fr-FR")} FCFA — Écriture ${ecritureId}`,
      ecriture.clientId,
      { sourceType: "ecriture", sourceId: ecritureId },
    );
  },

  addEcriture: async (e) => {
    const seq = get().ecritureSeq;
    const validatedPaye = Math.max(0, e.montantPaye);

    const { data, error } = await supabase
      .from("ecritures")
      .insert({
        date: e.date,
        date_paiement: e.datePaiement || null,
        client_id: e.clientId,
        dossier_id: e.dossierId || null,
        societe_id: e.societeId || null,
        annexe_id: e.annexeId,
        montant_investi: e.montantInvesti,
        montant_paye: validatedPaye,
        mode_paiement: e.modePaiement,
        note: e.note || null,
      })
      .select("*, clients(nom), societes(nom), annexes(nom)")
      .single();

    if (error) throw error;
    const newEcriture = mapEcritureFromDb(data);
    const updatedEcrituresPreview = [newEcriture, ...get().ecritures];

    let syncedMontantPaye: number | undefined;
    if (e.dossierId) {
      const dossier = get().dossiers.find((d) => d.id === e.dossierId);
      if (dossier) {
        syncedMontantPaye = await syncDossierPayeFromEcritures(
          e.dossierId,
          updatedEcrituresPreview,
          dossier,
        );
      }
    }

    set((s) => {
      const updatedEcritures = [newEcriture, ...s.ecritures];
      if (!e.dossierId) {
        return {
          ecritures: updatedEcritures,
          ecritureSeq: seq + 1,
          clients: syncClientStats(s.dossiers, s.factures, updatedEcritures, s.clients),
        };
      }
      const updatedDossiers = s.dossiers.map((d) =>
        d.id === e.dossierId
          ? { ...d, montantPaye: syncedMontantPaye ?? d.montantPaye }
          : d,
      );
      return {
        ecritures: updatedEcritures,
        ecritureSeq: seq + 1,
        dossiers: updatedDossiers,
        clients: syncClientStats(updatedDossiers, s.factures, updatedEcritures, s.clients),
      };
    });

    await get().addAuditLog(
      "Comptabilité",
      "Création",
      `Écriture créée pour ${e.clientNom}`,
      e.clientId,
      { sourceType: "ecriture", sourceId: newEcriture.id },
    );
    return newEcriture;
  },

  patchEcriture: async (id, patch) => {
    const existing = get().ecritures.find((e) => e.id === id);
    if (!existing) throw new Error("Écriture introuvable");
    const payload: Record<string, unknown> = {};
    if (patch.note !== undefined) payload.note = patch.note;
    if (patch.montantInvesti !== undefined) payload.montant_investi = Math.max(0, patch.montantInvesti);
    if (patch.montantPaye !== undefined) payload.montant_paye = Math.max(0, patch.montantPaye);

    const { error } = await supabase.from("ecritures").update(payload).eq("id", id);
    if (error) throw error;

    const updatedEcrituresPreview = get().ecritures.map((e) =>
      e.id === id
        ? {
            ...e,
            note: patch.note ?? e.note,
            montantInvesti: patch.montantInvesti ?? e.montantInvesti,
            montantPaye: patch.montantPaye ?? e.montantPaye,
          }
        : e,
    );

    let syncedMontantPaye: number | undefined;
    const dossierId = existing.dossierId;
    if (dossierId && patch.montantPaye !== undefined) {
      const dossier = get().dossiers.find((d) => d.id === dossierId);
      if (dossier) {
        syncedMontantPaye = await syncDossierPayeFromEcritures(
          dossierId,
          updatedEcrituresPreview,
          dossier,
        );
      }
    }

    set((s) => {
      const updatedEcritures = s.ecritures.map((e) =>
        e.id === id
          ? {
              ...e,
              note: patch.note ?? e.note,
              montantInvesti: patch.montantInvesti ?? e.montantInvesti,
              montantPaye: patch.montantPaye ?? e.montantPaye,
            }
          : e,
      );
      if (!dossierId || syncedMontantPaye === undefined) {
        return {
          ecritures: updatedEcritures,
          clients: syncClientStats(s.dossiers, s.factures, updatedEcritures, s.clients),
        };
      }
      const updatedDossiers = s.dossiers.map((d) =>
        d.id === dossierId ? { ...d, montantPaye: syncedMontantPaye } : d,
      );
      return {
        ecritures: updatedEcritures,
        dossiers: updatedDossiers,
        clients: syncClientStats(updatedDossiers, s.factures, updatedEcritures, s.clients),
      };
    });

    await get().addAuditLog(
      "Comptabilité",
      "Modification",
      `Écriture ${id.slice(0, 8)} modifiée (classeur)`,
      existing.clientId,
      { sourceType: "ecriture", sourceId: id },
    );
  },

  patchDossierClasseur: async (id, patch) => {
    const existing = get().dossiers.find((d) => d.id === id);
    if (!existing) throw new Error("Dossier introuvable");
    const payload: Record<string, unknown> = {};
    if (patch.montantInvesti !== undefined) payload.montant_investi = Math.max(0, patch.montantInvesti);
    if (patch.nature !== undefined) payload.nature = patch.nature;
    if (patch.bl !== undefined) payload.bl = patch.bl;

    let syncedMontantPaye: number | undefined;
    let updatedEcrituresPreview = get().ecritures;
    if (patch.montantPaye !== undefined) {
      const targetPaye = Math.max(0, patch.montantPaye);
      const linked = get().ecritures.filter((e) => e.dossierId === id);
      if (linked.length > 0) {
        for (let i = 0; i < linked.length; i++) {
          const { error: ecritureError } = await supabase
            .from("ecritures")
            .update({ montant_paye: i === 0 ? targetPaye : 0 })
            .eq("id", linked[i].id);
          if (ecritureError) throw ecritureError;
        }
        const firstId = linked[0].id;
        const linkedIds = new Set(linked.map((e) => e.id));
        updatedEcrituresPreview = get().ecritures.map((e) => {
          if (!linkedIds.has(e.id)) return e;
          return { ...e, montantPaye: e.id === firstId ? targetPaye : 0 };
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
      const updatedDossiers = s.dossiers.map((d) =>
        d.id === id
          ? {
              ...d,
              montantInvesti: patch.montantInvesti ?? d.montantInvesti,
              montantPaye: syncedMontantPaye ?? patch.montantPaye ?? d.montantPaye,
              nature: patch.nature ?? d.nature,
              bl: patch.bl ?? d.bl,
            }
          : d,
      );
      return {
        dossiers: updatedDossiers,
        ecritures: updatedEcrituresPreview,
        clients: syncClientStats(updatedDossiers, s.factures, updatedEcrituresPreview, s.clients),
      };
    });

    await get().addAuditLog(
      "Dossiers",
      "Modification",
      `Dossier ${existing.reference} modifié (classeur)`,
      existing.clientId,
      { sourceType: "dossier", sourceId: id },
    );
  },
});

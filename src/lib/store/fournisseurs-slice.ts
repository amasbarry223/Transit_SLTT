import { logWarn } from "@/shared/logger";
import type { StateCreator } from "zustand";
import { api } from "@/lib/api-client";
import { syncFournisseurStats } from "@/lib/fournisseur-stats";
import { requireActiveAnnexeId } from "@/lib/store/connected-user";
import { useSession } from "@/lib/session/session-store";
import type { DossierFournisseur, DossierFournisseurInput, Fournisseur, FournisseurInput } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

export interface FournisseursSlice {
  fournisseurs: Fournisseur[];
  dossierFournisseurs: DossierFournisseur[];
  addFournisseur: (input: FournisseurInput) => Promise<Fournisseur>;
  updateFournisseur: (id: string, input: FournisseurInput) => Promise<void>;
  removeFournisseur: (id: string) => Promise<void>;
  addDossierFournisseur: (input: DossierFournisseurInput) => Promise<DossierFournisseur>;
  updateDossierFournisseur: (id: string, input: Partial<DossierFournisseurInput>) => Promise<void>;
  removeDossierFournisseur: (id: string) => Promise<void>;
}

export const createFournisseursSlice: StateCreator<SLTTState, [], [], FournisseursSlice> = (set, get) => ({
  fournisseurs: [],
  dossierFournisseurs: [],

  addFournisseur: async (input) => {
    const seq = get().fournisseurSeq;
    const userId = useSession.getState().currentUserId;
    const userAnnexeIds = get().users.find((u) => u.id === userId)?.annexeIds ?? [];
    const annexeId = requireActiveAnnexeId(userAnnexeIds, get().annexes);

    const newFourn: Fournisseur = {
      id: crypto.randomUUID(),
      nom: input.nom,
      type: input.type,
      contact: input.contact,
      telephone: input.telephone,
      email: input.email || "",
      adresse: input.adresse || "",
      tarifContractuel: input.tarifContractuel,
      nbDossiers: 0,
      montantTotal: 0,
      statut: input.statut || "Actif",
      annexeId,
    };

    try {
      const created = await api.fournisseurs.create({
        nom: input.nom,
        type: input.type,
        contact: input.contact,
        telephone: input.telephone,
        email: input.email,
        adresse: input.adresse,
        tarifContractuel: input.tarifContractuel,
        statut: input.statut || "Actif",
        annexeId,
      });
      if (created?.id) {
        newFourn.id = created.id;
      }
    } catch (e) {
      logWarn("api.fournisseurs.create (mode local)", e);
    }

    set((s) => ({
      fournisseurs: [newFourn, ...s.fournisseurs],
      fournisseurSeq: seq + 1,
    }));
    await get().addAuditLog(AUDIT_MODULE.Fournisseurs, AUDIT_ACTION.Creation, `Fournisseur ${input.nom} créé`);
    return newFourn;
  },

  updateFournisseur: async (id, input) => {
    try {
      await api.fournisseurs.update(id, {
        nom: input.nom,
        type: input.type,
        contact: input.contact,
        telephone: input.telephone,
        email: input.email,
        adresse: input.adresse,
        tarifContractuel: input.tarifContractuel,
        statut: input.statut,
      });
    } catch (e) {
      logWarn("api.fournisseurs.update (mode local)", e);
    }

    set((s) => ({
      fournisseurs: s.fournisseurs.map((f) => (f.id === id ? { ...f, ...input } : f)),
    }));
    await get().addAuditLog(AUDIT_MODULE.Fournisseurs, AUDIT_ACTION.Modification, `Fournisseur ${input.nom} mis à jour`);
  },

  removeFournisseur: async (id) => {
    const fourn = get().fournisseurs.find((f) => f.id === id);
    const dossiersLies = get().dossierFournisseurs.filter((df) => df.fournisseurId === id).length;
    if (dossiersLies > 0) {
      throw new Error(
        `Impossible de supprimer ${fourn?.nom ?? "ce fournisseur"} : il est lié à ${dossiersLies} dossier(s). Retirez-le d'abord de ces dossiers.`,
      );
    }

    await api.fournisseurs.delete(id);

    set((s) => ({
      fournisseurs: s.fournisseurs.filter((f) => f.id !== id),
      dossierFournisseurs: s.dossierFournisseurs.filter((df) => df.fournisseurId !== id),
    }));
    if (fourn) {
      await get().addAuditLog(AUDIT_MODULE.Fournisseurs, AUDIT_ACTION.Suppression, `Fournisseur ${fourn.nom} supprimé`);
    }
  },

  addDossierFournisseur: async (input) => {
    const seq = get().dossierFournisseurSeq;
    const fourn = get().fournisseurs.find((f) => f.id === input.fournisseurId);
    const dos = get().dossiers.find((d) => d.id === input.dossierId);

    const newDf: DossierFournisseur = {
      id: crypto.randomUUID(),
      dossierId: input.dossierId,
      dossierRef: dos?.reference,
      fournisseurId: input.fournisseurId,
      fournisseurNom: fourn?.nom || "",
      type: fourn?.type || ("Transport" as DossierFournisseur["type"]),
      description: input.description,
      montantBudgete: input.montantBudgete,
      montantReel: input.montantReel,
      statut: input.statut || "En attente",
      date: input.date || new Date().toISOString().slice(0, 10),
    };
    set((s) => {
      const updatedDf = [newDf, ...s.dossierFournisseurs];
      return {
        dossierFournisseurs: updatedDf,
        dossierFournisseurSeq: seq + 1,
        fournisseurs: syncFournisseurStats(updatedDf, s.fournisseurs),
      };
    });
    await get().addAuditLog(
      AUDIT_MODULE.Fournisseurs,
      AUDIT_ACTION.Creation,
      `Lien fournisseur ${newDf.fournisseurNom} ↔ dossier ${newDf.dossierRef ?? newDf.dossierId} créé`,
    );
    return newDf;
  },

  updateDossierFournisseur: async (id, input) => {
    set((s) => {
      const updatedDf = s.dossierFournisseurs.map((df) => (df.id === id ? { ...df, ...input } : df));
      return {
        dossierFournisseurs: updatedDf,
        fournisseurs: syncFournisseurStats(updatedDf, s.fournisseurs),
      };
    });
    await get().addAuditLog(AUDIT_MODULE.Fournisseurs, AUDIT_ACTION.Modification, `Lien fournisseur ↔ dossier modifié`);
  },

  removeDossierFournisseur: async (id) => {
    const target = get().dossierFournisseurs.find((df) => df.id === id);

    set((s) => {
      const updatedDf = s.dossierFournisseurs.filter((df) => df.id !== id);
      return {
        dossierFournisseurs: updatedDf,
        fournisseurs: syncFournisseurStats(updatedDf, s.fournisseurs),
      };
    });
    if (target) {
      await get().addAuditLog(
        AUDIT_MODULE.Fournisseurs,
        AUDIT_ACTION.Suppression,
        `Lien fournisseur ${target.fournisseurNom} ↔ dossier ${target.dossierRef ?? target.dossierId} supprimé`,
      );
    }
  },
});

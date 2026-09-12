import type { StateCreator } from "zustand";
import { api } from "@/lib/api-client";
import type { Annexe, AnnexeInput } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

export interface AnnexesSlice {
  annexes: Annexe[];
  updateAnnexe: (id: string, input: AnnexeInput) => Promise<void>;
}

export const createAnnexesSlice: StateCreator<SLTTState, [], [], AnnexesSlice> = (set, get) => ({
  annexes: [],

  updateAnnexe: async (id, input) => {
    // Persistance obligatoire : un échec silencieux ici (ancien try/catch +
    // logWarn) laissait l'identité annexe divergente entre l'UI et la base,
    // sans jamais prévenir l'utilisateur — même bug déjà corrigé dans les
    // autres slices (fournisseurs, transporteurs…), laisser l'erreur remonter.
    // villeSiege est le nom front de la colonne `ville`.
    await api.annexes.update(id, {
      ville: input.villeSiege ?? undefined,
      adresse: input.adresse ?? null,
      telephone: input.telephone ?? null,
      rccm: input.rccm ?? null,
      nif: input.nif ?? null,
    });

    set((s) => ({
      annexes: s.annexes.map((a) => (a.id === id ? { ...a, ...input } : a)),
    }));
    await get().addAuditLog(AUDIT_MODULE.Annexes, AUDIT_ACTION.Modification, "Identité annexe mise à jour");
  },
});

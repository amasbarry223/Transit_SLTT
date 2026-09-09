import { logWarn } from "@/shared/logger";
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
    try {
      // L'API n'a que ville / adresse / telephone ; villeSiege est le nom front
      // de `ville`. rccm / nif n'ont pas de colonne annexe (portés par la
      // société) -> non envoyés, sinon Prisma rejette l'argument inconnu.
      await api.annexes.update(id, {
        ville: input.villeSiege ?? undefined,
        adresse: input.adresse ?? null,
        telephone: input.telephone ?? null,
      });
    } catch (e) {
      logWarn("api.annexes.update a échoué (mode déconnecté/local)", e);
    }

    set((s) => ({
      annexes: s.annexes.map((a) => (a.id === id ? { ...a, ...input } : a)),
    }));
    await get().addAuditLog(AUDIT_MODULE.Annexes, AUDIT_ACTION.Modification, "Identité annexe mise à jour");
  },
});

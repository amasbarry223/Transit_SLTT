import { logWarn } from "@/shared/logger";
import type { StateCreator } from "zustand";
import { api } from "@/lib/api-client";
import type { Annexe, AnnexeInput } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import type { AnnexeRow } from "@/lib/db-rows";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

export function mapAnnexeFromDb(row: AnnexeRow): Annexe {
  return {
    id: row.id,
    nom: row.nom,
    code: row.code,
    villeSiege: row.ville_siege,
    adresse: row.adresse || undefined,
    telephone: row.telephone || undefined,
    rccm: row.rccm || undefined,
    nif: row.nif || undefined,
    devise: row.devise,
    actif: row.actif,
  };
}

export interface AnnexesSlice {
  annexes: Annexe[];
  updateAnnexe: (id: string, input: AnnexeInput) => Promise<void>;
}

export const createAnnexesSlice: StateCreator<SLTTState, [], [], AnnexesSlice> = (set, get) => ({
  annexes: [],

  updateAnnexe: async (id, input) => {
    try {
      await api.annexes.update(id, {
        villeSiege: input.villeSiege,
        adresse: input.adresse || null,
        telephone: input.telephone || null,
        rccm: input.rccm || null,
        nif: input.nif || null,
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

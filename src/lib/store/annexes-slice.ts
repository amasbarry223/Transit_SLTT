import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Annexe, AnnexeInput } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import type { AnnexeRow } from "@/lib/db-rows";

export function mapAnnexeFromDb(x: AnnexeRow): Annexe {
  return {
    id: x.id,
    nom: x.nom,
    code: x.code,
    villeSiege: x.ville_siege,
    adresse: x.adresse || undefined,
    telephone: x.telephone || undefined,
    rccm: x.rccm || undefined,
    nif: x.nif || undefined,
    devise: x.devise,
    actif: x.actif,
  };
}

export interface AnnexesSlice {
  annexes: Annexe[];
  updateAnnexe: (id: string, input: AnnexeInput) => Promise<void>;
}

export const createAnnexesSlice: StateCreator<SLTTState, [], [], AnnexesSlice> = (set, get) => ({
  annexes: [],

  updateAnnexe: async (id, input) => {
    const { error } = await supabase
      .from("annexes")
      .update({
        ville_siege: input.villeSiege,
        adresse: input.adresse || null,
        telephone: input.telephone || null,
        rccm: input.rccm || null,
        nif: input.nif || null,
      })
      .eq("id", id);
    if (error) throw error;

    set((s) => ({
      annexes: s.annexes.map((a) => (a.id === id ? { ...a, ...input } : a)),
    }));
    await get().addAuditLog("Annexes", "Modification", "Identité annexe mise à jour");
  },
});

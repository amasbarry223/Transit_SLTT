import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Transporteur, TransporteurStatut } from "@/lib/domain-types";
import type { TransporteurInput, SLTTState } from "@/lib/store";
import type { TransporteurRow } from "@/lib/db-rows";

export function mapTransporteurFromDb(x: TransporteurRow): Transporteur {
  return {
    id: x.id,
    nom: x.nom,
    contact: x.contact || "",
    telephone: x.telephone,
    email: x.email || undefined,
    vehicule: x.vehicule,
    immatriculation: x.immatriculation,
    trajet: x.trajet || "",
    capacite: x.capacite ? Number(x.capacite) : 0,
    statut: x.statut,
    nbDossiers: 0,
    dateCreation: x.date_creation || new Date().toISOString().slice(0, 10),
    notes: x.notes || undefined,
  };
}

export interface TransporteursSlice {
  transporteurs: Transporteur[];
  addTransporteur: (input: TransporteurInput) => Promise<Transporteur>;
  updateTransporteur: (id: string, input: TransporteurInput) => Promise<void>;
  updateTransporteurStatut: (id: string, statut: TransporteurStatut) => Promise<void>;
  removeTransporteur: (id: string) => Promise<void>;
}

export const createTransporteursSlice: StateCreator<SLTTState, [], [], TransporteursSlice> = (set, get) => ({
  transporteurs: [],

  addTransporteur: async (input) => {
    const seq = get().transporteurSeq;

    const { data, error } = await supabase
      .from("transporteurs")
      .insert({
        nom: input.nom,
        contact: input.contact,
        telephone: input.telephone,
        email: input.email,
        vehicule: input.vehicule,
        immatriculation: input.immatriculation,
        trajet: input.trajet,
        capacite: input.capacite,
        statut: input.statut,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) throw error;
    const newTr = mapTransporteurFromDb(data);
    set((s) => ({
      transporteurs: [newTr, ...s.transporteurs],
      transporteurSeq: seq + 1,
    }));
    await get().addAuditLog("Transporteurs", "Création", `Transporteur ${input.nom} ajouté`);
    return newTr;
  },

  updateTransporteur: async (id, input) => {
    const { error } = await supabase
      .from("transporteurs")
      .update({
        nom: input.nom,
        contact: input.contact,
        telephone: input.telephone,
        email: input.email,
        vehicule: input.vehicule,
        immatriculation: input.immatriculation,
        trajet: input.trajet,
        capacite: input.capacite,
        statut: input.statut,
        notes: input.notes,
      })
      .eq("id", id);
    if (error) throw error;

    set((s) => ({
      transporteurs: s.transporteurs.map((t) => (t.id === id ? { ...t, ...input } : t)),
    }));
    await get().addAuditLog("Transporteurs", "Modification", `Transporteur ${input.nom} mis à jour`);
  },

  updateTransporteurStatut: async (id, statut) => {
    const { error } = await supabase
      .from("transporteurs")
      .update({ statut })
      .eq("id", id);
    if (error) throw error;

    set((s) => ({
      transporteurs: s.transporteurs.map((t) => (t.id === id ? { ...t, statut } : t)),
    }));
  },

  removeTransporteur: async (id) => {
    const trans = get().transporteurs.find((t) => t.id === id);

    const { error } = await supabase.from("transporteurs").delete().eq("id", id);
    if (error) throw error;

    set((s) => ({
      transporteurs: s.transporteurs.filter((t) => t.id !== id),
    }));

    if (trans) {
      await get().addAuditLog("Transporteurs", "Suppression", `Transporteur ${trans.nom} supprimé`);
    }
  },
});

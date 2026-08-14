import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Transporteur, TransporteurStatut } from "@/lib/domain-types";
import type { TransporteurInput, SLTTState } from "@/lib/store";
import type { TransporteurRow } from "@/lib/db-rows";
import { requireActiveAnnexeId } from "@/lib/store/connected-user";
import { useSession } from "@/lib/session/session-store";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

export function mapTransporteurFromDb(row: TransporteurRow): Transporteur {
  return {
    id: row.id,
    nom: row.nom,
    contact: row.contact || "",
    telephone: row.telephone,
    email: row.email || undefined,
    vehicule: row.vehicule,
    immatriculation: row.immatriculation,
    trajet: row.trajet || "",
    capacite: row.capacite ? Number(row.capacite) : 0,
    statut: row.statut,
    nbDossiers: 0,
    dateCreation: row.date_creation || new Date().toISOString().slice(0, 10),
    notes: row.notes || undefined,
    annexeId: row.annexe_id,
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
    const userId = useSession.getState().currentUserId;
    const annexeId = requireActiveAnnexeId(get().users.find((u) => u.id === userId)?.annexeIds ?? []);

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
        annexe_id: annexeId,
      })
      .select()
      .single();

    if (error) throw error;
    const newTr = mapTransporteurFromDb(data);
    set((s) => ({
      transporteurs: [newTr, ...s.transporteurs],
      transporteurSeq: seq + 1,
    }));
    await get().addAuditLog(AUDIT_MODULE.Transporteurs, AUDIT_ACTION.Creation, `Transporteur ${input.nom} ajouté`);
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
    await get().addAuditLog(AUDIT_MODULE.Transporteurs, AUDIT_ACTION.Modification, `Transporteur ${input.nom} mis à jour`);
  },

  updateTransporteurStatut: async (id, statut) => {
    const transporteur = get().transporteurs.find((t) => t.id === id);
    const { error } = await supabase
      .from("transporteurs")
      .update({ statut })
      .eq("id", id);
    if (error) throw error;

    set((s) => ({
      transporteurs: s.transporteurs.map((t) => (t.id === id ? { ...t, statut } : t)),
    }));
    if (transporteur) {
      await get().addAuditLog(AUDIT_MODULE.Transporteurs, AUDIT_ACTION.Modification, `Transporteur ${transporteur.nom} → ${statut}`);
    }
  },

  removeTransporteur: async (id) => {
    const trans = get().transporteurs.find((t) => t.id === id);

    const { error } = await supabase.from("transporteurs").delete().eq("id", id);
    if (error) throw error;

    set((s) => ({
      transporteurs: s.transporteurs.filter((t) => t.id !== id),
    }));

    if (trans) {
      await get().addAuditLog(AUDIT_MODULE.Transporteurs, AUDIT_ACTION.Suppression, `Transporteur ${trans.nom} supprimé`);
    }
  },
});

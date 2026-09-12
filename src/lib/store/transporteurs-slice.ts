import type { StateCreator } from "zustand";
import type { Transporteur, TransporteurStatut } from "@/lib/domain-types";
import type { TransporteurInput, SLTTState } from "@/lib/store";
import { requireActiveAnnexeId } from "@/lib/store/connected-user";
import { useSession } from "@/lib/session/session-store";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

export interface TransporteursSlice {
  transporteurs: Transporteur[];
  addTransporteur: (input: TransporteurInput) => Promise<Transporteur>;
  updateTransporteur: (id: string, input: TransporteurInput) => Promise<void>;
  updateTransporteurStatut: (id: string, statut: TransporteurStatut) => Promise<void>;
  removeTransporteur: (id: string) => Promise<void>;
}

import { api } from "@/lib/api-client";

export const createTransporteursSlice: StateCreator<SLTTState, [], [], TransporteursSlice> = (set, get) => ({
  transporteurs: [],

  addTransporteur: async (input) => {
    const seq = get().transporteurSeq;
    const userId = useSession.getState().currentUserId;
    const userAnnexeIds = get().users.find((u) => u.id === userId)?.annexeIds ?? [];
    const annexeId = requireActiveAnnexeId(userAnnexeIds, get().annexes);

    // Persistance obligatoire : un transporteur sans écriture serveur
    // disparaissait silencieusement au rechargement, sans aucune erreur
    // montrée.
    const created = await api.transporteurs.create({
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
      annexeId,
    });

    const newTr: Transporteur = {
      id: created?.id ?? crypto.randomUUID(),
      nom: input.nom,
      contact: input.contact || "",
      telephone: input.telephone,
      email: input.email || undefined,
      vehicule: input.vehicule,
      immatriculation: input.immatriculation,
      trajet: input.trajet || "",
      capacite: input.capacite ? Number(input.capacite) : 0,
      statut: input.statut,
      nbDossiers: 0,
      dateCreation: new Date().toISOString().slice(0, 10),
      notes: input.notes || undefined,
      annexeId,
    };
    set((s) => ({
      transporteurs: [newTr, ...s.transporteurs],
      transporteurSeq: seq + 1,
    }));
    await get().addAuditLog(AUDIT_MODULE.Transporteurs, AUDIT_ACTION.Creation, `Transporteur ${input.nom} ajouté`);
    return newTr;
  },

  updateTransporteur: async (id, input) => {
    await api.transporteurs.update(id, input);

    set((s) => ({
      transporteurs: s.transporteurs.map((t) => (t.id === id ? { ...t, ...input } : t)),
    }));
    await get().addAuditLog(AUDIT_MODULE.Transporteurs, AUDIT_ACTION.Modification, `Transporteur ${input.nom} mis à jour`);
  },

  updateTransporteurStatut: async (id, statut) => {
    await api.transporteurs.update(id, { statut });

    const transporteur = get().transporteurs.find((t) => t.id === id);
    set((s) => ({
      transporteurs: s.transporteurs.map((t) => (t.id === id ? { ...t, statut } : t)),
    }));
    if (transporteur) {
      await get().addAuditLog(AUDIT_MODULE.Transporteurs, AUDIT_ACTION.Modification, `Transporteur ${transporteur.nom} → ${statut}`);
    }
  },

  removeTransporteur: async (id) => {
    await api.transporteurs.delete(id);

    const trans = get().transporteurs.find((t) => t.id === id);
    set((s) => ({
      transporteurs: s.transporteurs.filter((t) => t.id !== id),
    }));
    if (trans) {
      await get().addAuditLog(AUDIT_MODULE.Transporteurs, AUDIT_ACTION.Suppression, `Transporteur ${trans.nom} supprimé`);
    }
  },
});

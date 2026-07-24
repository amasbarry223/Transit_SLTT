import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Client } from "@/lib/domain-types";
import type { ClientInput, SLTTState } from "@/lib/store";
import type { ClientRow } from "@/lib/db-rows";

export function mapClientFromDb(x: ClientRow): Client {
  return {
    id: x.id,
    nom: x.nom,
    type: x.type,
    telephone: x.telephone,
    email: x.email,
    adresse: x.adresse,
    nbDossiers: 0,
    totalDu: 0,
    totalPaye: 0,
  };
}

export interface ClientsSlice {
  clients: Client[];
  addClient: (input: ClientInput) => Promise<Client>;
  updateClient: (id: string, input: ClientInput) => Promise<void>;
  getClient: (id: string) => Client | undefined;
}

export const createClientsSlice: StateCreator<SLTTState, [], [], ClientsSlice> = (set, get) => ({
  clients: [],

  addClient: async (input) => {
    const seq = get().clientSeq;

    const { data, error } = await supabase
      .from("clients")
      .insert({
        nom: input.nom,
        type: input.type,
        telephone: input.telephone,
        email: input.email,
        adresse: input.adresse,
      })
      .select()
      .single();

    if (error) throw error;
    const newClient = mapClientFromDb(data);
    set((s) => ({
      clients: [newClient, ...s.clients],
      clientSeq: seq + 1,
    }));
    await get().addAuditLog("Clients", "Création", `Client ${input.nom} créé`, newClient.id);
    return newClient;
  },

  updateClient: async (id, input) => {
    const { error } = await supabase
      .from("clients")
      .update({
        nom: input.nom,
        type: input.type,
        telephone: input.telephone,
        email: input.email,
        adresse: input.adresse,
      })
      .eq("id", id);
    if (error) throw error;

    set((s) => ({
      clients: s.clients.map((c) => (c.id === id ? { ...c, ...input } : c)),
    }));
    await get().addAuditLog("Clients", "Modification", `Client ${input.nom} mis à jour`, id);
  },

  getClient: (id) => get().clients.find((c) => c.id === id),
});

import type { StateCreator } from "zustand";
import { api } from "@/lib/api-client";
import type { Port, PortInput } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

export interface PortsSlice {
  ports: Port[];
  addPort: (input: PortInput) => Promise<Port>;
  updatePort: (id: string, input: PortInput) => Promise<void>;
  removePort: (id: string) => Promise<void>;
}

export const createPortsSlice: StateCreator<SLTTState, [], [], PortsSlice> = (set, get) => ({
  ports: [],

  addPort: async (input) => {
    const created = await api.ports.create({
      code: input.code,
      nom: input.nom,
      ville: input.ville,
      pays: input.pays,
    });

    const newPort: Port = {
      id: created?.id ?? crypto.randomUUID(),
      code: input.code,
      nom: input.nom,
      ville: input.ville,
      pays: input.pays,
      actif: true,
    };

    set((s) => ({ ports: [newPort, ...s.ports] }));
    await get().addAuditLog(AUDIT_MODULE.Ports, AUDIT_ACTION.Creation, `Port ${input.nom} créé`);
    return newPort;
  },

  updatePort: async (id, input) => {
    await api.ports.update(id, {
      code: input.code,
      nom: input.nom,
      ville: input.ville,
      pays: input.pays,
    });

    set((s) => ({
      ports: s.ports.map((p) => (p.id === id ? { ...p, ...input } : p)),
    }));
    await get().addAuditLog(AUDIT_MODULE.Ports, AUDIT_ACTION.Modification, `Port ${input.nom} mis à jour`);
  },

  removePort: async (id) => {
    const port = get().ports.find((p) => p.id === id);
    await api.ports.update(id, { actif: false });

    set((s) => ({
      ports: s.ports.map((p) => (p.id === id ? { ...p, actif: false } : p)),
    }));
    if (port) {
      await get().addAuditLog(AUDIT_MODULE.Ports, AUDIT_ACTION.Suppression, `Port ${port.nom} désactivé`);
    }
  },
});

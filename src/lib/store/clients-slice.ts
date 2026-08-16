import type { StateCreator } from "zustand";
import type { Client, ClientInput } from "@/features/clients/types";
import { clientInputSchema } from "@/features/clients/schemas/client-schema";
import { clientService } from "@/features/clients/services/client-service";
import { mapClientFromDb } from "@/features/clients/services/client-mapper";
import { ValidationError } from "@/shared/errors";
import type { SLTTState } from "@/lib/store";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

export { mapClientFromDb };

export interface ClientsSlice {
  clients: Client[];
  addClient: (input: ClientInput) => Promise<Client>;
  updateClient: (id: string, input: ClientInput) => Promise<void>;
  getClient: (id: string) => Client | undefined;
}

function parseClientInput(input: ClientInput): ClientInput {
  const parsed = clientInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      "Les données du client sont invalides.",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }
  return parsed.data;
}

export const createClientsSlice: StateCreator<SLTTState, [], [], ClientsSlice> = (set, get) => ({
  clients: [],

  addClient: async (input) => {
    const validInput = parseClientInput(input);
    const seq = get().clientSeq;
    const result = await clientService.create(validInput);
    if (!result.ok) throw result.error;

    const newClient = result.value;
    set((s) => ({
      clients: [newClient, ...s.clients],
      clientSeq: seq + 1,
    }));
    await get().addAuditLog(
      AUDIT_MODULE.Clients,
      AUDIT_ACTION.Creation,
      `Client ${validInput.nom} créé`,
      newClient.id,
    );
    return newClient;
  },

  updateClient: async (id, input) => {
    const validInput = parseClientInput(input);
    const result = await clientService.update(id, validInput);
    if (!result.ok) throw result.error;

    set((s) => ({
      clients: s.clients.map((c) => (c.id === id ? { ...c, ...validInput } : c)),
    }));
    await get().addAuditLog(
      AUDIT_MODULE.Clients,
      AUDIT_ACTION.Modification,
      `Client ${validInput.nom} mis à jour`,
      id,
    );
  },

  getClient: (id) => get().clients.find((c) => c.id === id),
});

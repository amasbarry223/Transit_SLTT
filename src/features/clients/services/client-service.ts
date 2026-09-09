import { api } from "@/lib/api-client";
import { AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";
import type { Client, ClientInput } from "@/features/clients/types";

function toAppError(error: unknown, fallback: string): AppError {
  if (error instanceof AppError) return error;
  const message = error instanceof Error ? error.message : fallback;
  return new AppError(message, "CLIENT_SERVICE_ERROR", error);
}

export async function createClient(input: ClientInput): Promise<Result<Client, AppError>> {
  try {
    const created = await api.clients.create({
      nom: input.nom,
      type: input.type,
      telephone: input.telephone,
      email: input.email,
      adresse: input.adresse,
    });
    return ok({
      id: created.id,
      nom: created.nom,
      type: created.type === "PARTICULIER" ? "Particulier" : "Entreprise",
      telephone: created.telephone || "",
      email: created.email || "",
      adresse: created.adresse || "",
      annexeId: input.annexeId,
      annexeNom: "",
      nbDossiers: 0,
      totalDu: 0,
      totalPaye: 0,
    });
  } catch (e) {
    return err(toAppError(e, "Impossible de créer le client."));
  }
}

export async function updateClient(
  id: string,
  input: ClientInput,
): Promise<Result<void, AppError>> {
  try {
    await api.clients.update(id, {
      nom: input.nom,
      type: input.type,
      telephone: input.telephone,
      email: input.email,
      adresse: input.adresse,
    });
    return ok(undefined);
  } catch (e) {
    return err(toAppError(e, "Impossible de mettre à jour le client."));
  }
}

export async function deleteClient(id: string): Promise<Result<void, AppError>> {
  try {
    await api.clients.delete(id);
    return ok(undefined);
  } catch (e) {
    return err(toAppError(e, "Impossible de supprimer le client."));
  }
}

export const clientService = {
  create: createClient,
  update: updateClient,
  delete: deleteClient,
};


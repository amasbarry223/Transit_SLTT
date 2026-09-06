import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { api } from "@/lib/api-client";
import { AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";
import type { Client, ClientInput } from "@/features/clients/types";
import { mapClientFromDb, mapClientInputToDb } from "./client-mapper";

const CLIENT_SELECT = "*, annexes(nom)";

function toAppError(error: unknown, fallback: string): AppError {
  if (error instanceof AppError) return error;
  const message = error instanceof Error ? error.message : fallback;
  return new AppError(message, "CLIENT_SERVICE_ERROR", error);
}

export async function createClient(input: ClientInput): Promise<Result<Client, AppError>> {
  if (!isSupabaseConfigured) {
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
        type: (created.type === "PARTICULIER" ? "Particulier" : "Entreprise") as any,
        telephone: created.telephone || "",
        email: created.email || "",
        adresse: created.adresse || "",
        annexeId: input.annexeId,
        annexeNom: "",
        nbDossiers: 0,
        totalDu: 0,
        totalPaye: 0,
      });
    } catch (e: any) {
      return err(toAppError(e, e?.message || "Impossible de créer le client."));
    }
  }

  const { data, error } = await supabase
    .from("clients")
    .insert(mapClientInputToDb(input))
    .select(CLIENT_SELECT)
    .single();

  if (error) return err(toAppError(error, "Impossible de créer le client."));
  return ok(mapClientFromDb(data));
}

export async function updateClient(
  id: string,
  input: ClientInput,
): Promise<Result<void, AppError>> {
  if (!isSupabaseConfigured) {
    try {
      await api.clients.update(id, {
        nom: input.nom,
        type: input.type,
        telephone: input.telephone,
        email: input.email,
        adresse: input.adresse,
      });
      return ok(undefined);
    } catch (e: any) {
      return err(toAppError(e, e?.message || "Impossible de mettre à jour le client."));
    }
  }

  const { error } = await supabase
    .from("clients")
    .update(mapClientInputToDb(input))
    .eq("id", id);

  if (error) return err(toAppError(error, "Impossible de mettre à jour le client."));
  return ok(undefined);
}

export const clientService = {
  create: createClient,
  update: updateClient,
};


import { supabase } from "@/lib/supabase";
import { AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";
import type { Client, ClientInput } from "@/features/clients/types";
import { mapClientFromDb, mapClientInputToDb } from "./client-mapper";

const CLIENT_SELECT = "*, annexes(nom), societes(nom)";

function toAppError(error: unknown, fallback: string): AppError {
  if (error instanceof AppError) return error;
  const message = error instanceof Error ? error.message : fallback;
  return new AppError(message, "CLIENT_SERVICE_ERROR", error);
}

export async function createClient(input: ClientInput): Promise<Result<Client, AppError>> {
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

import { z } from "zod";
import type { UserRole } from "@/lib/domain-types";
import { EXPORT_MODULES } from "@/lib/export/export-modules";

export const USER_ROLES = [
  "Administrateur",
  "Agent de transit",
  "Comptable",
  "Magasinier",
] as const satisfies readonly UserRole[];

export const createUserBodySchema = z.object({
  nom: z.string().trim().min(1, "Nom requis"),
  email: z.string().trim().email("E-mail invalide"),
  role: z.enum(USER_ROLES),
  permissions: z.array(z.string()).optional().default([]),
  password: z.string().min(8, "Mot de passe (8 caractères min.) requis"),
});

export const updateUserBodySchema = z.object({
  nom: z.string().trim().min(1, "Nom requis"),
  email: z.string().trim().email("E-mail invalide"),
  role: z.enum(USER_ROLES),
  permissions: z.array(z.string()).optional().default([]),
  actif: z.boolean().optional(),
});

export const resetPasswordBodySchema = z.object({
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis."),
  newPassword: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères."),
});

export const updateUserAnnexesBodySchema = z.object({
  annexeIds: z.array(z.string()).min(1, "Au moins une annexe doit être assignée à l'utilisateur."),
});

/**
 * Le fichier .xlsx est construit côté client (les données y sont déjà) —
 * cette route ne fait plus qu'autoriser l'export d'un module, donc son
 * corps de requête se limite au module concerné.
 */
export const exportExcelBodySchema = z.object({
  module: z.enum(EXPORT_MODULES, { message: "Module d'export requis." }),
});

export function zodErrorMessage(err: z.ZodError): string {
  return err.issues[0]?.message || "Requête invalide.";
}

export { backupRestoreSchema, operationImportRowSchema, operationImportRowsSchema } from "@/lib/schemas/store-inputs";

import { z } from "zod";
import { EXPORT_MODULES } from "@/lib/export/export-modules";

const strongPasswordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule.")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule.")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre.");

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis."),
  newPassword: strongPasswordSchema,
});

export const updateOwnProfileBodySchema = z.object({
  nom: z.string().trim().min(1, "Nom requis"),
  email: z.string().trim().email("E-mail invalide"),
});

export function passwordStrengthError(password: string): string | null {
  const parsed = strongPasswordSchema.safeParse(password);
  return parsed.success ? null : (parsed.error.issues[0]?.message ?? "Mot de passe invalide.");
}

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

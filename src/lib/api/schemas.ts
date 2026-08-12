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

/** Plafond export Excel (aligné API). */
export const EXPORT_MAX_ROWS = 2_000;

export const exportExcelBodySchema = z.object({
  module: z.enum(EXPORT_MODULES, { message: "Module d'export requis." }),
  filename: z.string().max(120).optional().default("export"),
  headers: z
    .array(z.string().trim().min(1).max(200))
    .min(1, "En-têtes de colonnes requis."),
  rows: z
    .array(z.array(z.unknown()))
    .min(1, "Aucune ligne à exporter.")
    .max(EXPORT_MAX_ROWS, `Maximum ${EXPORT_MAX_ROWS} lignes par export.`),
});

export function zodErrorMessage(err: z.ZodError): string {
  return err.issues[0]?.message || "Requête invalide.";
}

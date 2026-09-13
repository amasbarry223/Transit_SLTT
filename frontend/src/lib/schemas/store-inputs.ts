import { z } from "zod";

export const backupRestoreSchema = z.object({
  meta: z
    .object({
      exportedAt: z.string(),
      tables: z.array(z.string()),
    })
    .optional(),
  data: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
});

export type BackupRestorePayload = z.infer<typeof backupRestoreSchema>;

export const operationImportRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  date: z.string().nullable(),
  dateRaw: z.string(),
  clientNom: z.string(),
  nature: z.string(),
  type: z.enum(["Entrée", "Sortie"]).nullable(),
  montant: z.number(),
  quantite: z.number().nullable(),
  prixUnitaire: z.number().nullable(),
  warnings: z.array(z.string()),
});

export const operationImportRowsSchema = z.array(operationImportRowSchema);

export type OperationImportRowValidated = z.infer<typeof operationImportRowSchema>;

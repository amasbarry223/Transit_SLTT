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

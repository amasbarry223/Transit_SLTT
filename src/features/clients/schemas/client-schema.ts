import { z } from "zod";

export const CLIENT_TYPES = ["Entreprise", "Particulier"] as const;

export const clientInputSchema = z.object({
  nom: z.string().trim().min(1, "Le nom est obligatoire."),
  type: z.enum(CLIENT_TYPES),
  telephone: z.string(),
  email: z.string(),
  adresse: z.string(),
  annexeId: z.string(),
});

export type ClientInputValidated = z.infer<typeof clientInputSchema>;

import { z } from "zod";

export const devisInputSchema = z.object({
  clientId: z.string().min(1),
  clientNom: z.string(),
  societeId: z.string().min(1, "La société est obligatoire."),
  nature: z.string().min(1),
  droitDouane: z.number().nonnegative(),
  fraisCircuit: z.number().nonnegative(),
  fraisPrestation: z.number().nonnegative(),
  dateValidite: z.string().min(1),
  notes: z.string().optional(),
});

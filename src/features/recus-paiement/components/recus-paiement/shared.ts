import type { Annexe, Societe } from "@/lib/domain-types";
import type { RecuPaiementModuleData } from "@/lib/export";
import { mergeAnnexeIntoBrand, resolveSlttBrand, type SocieteBrand } from "@/lib/societe-brand";

export interface RecuFormModuleInput {
  nom: string;
  prenom: string;
  somme: number;
  motif: string;
  montantPaye: number;
  reste: number;
  date: string;
  signature?: string;
}

export function resolveGeneratorBrand(
  societes: Societe[],
  annexes: Annexe[],
  activeAnnexeId: string | null,
): SocieteBrand | null {
  const base = resolveSlttBrand(societes);
  if (!base) return null;
  const annexe = activeAnnexeId ? annexes.find((a) => a.id === activeAnnexeId) : undefined;
  return annexe ? mergeAnnexeIntoBrand(base, annexe) : base;
}

export function formToModuleData(input: RecuFormModuleInput): RecuPaiementModuleData {
  return {
    date: input.date,
    nom: input.nom,
    prenom: input.prenom,
    somme: input.somme,
    motif: input.motif,
    montantPaye: input.montantPaye,
    reste: input.reste,
    signature: input.signature,
  };
}


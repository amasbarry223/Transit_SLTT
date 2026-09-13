import type { Annexe, Societe } from "@/lib/domain-types";
import { mergeAnnexeIntoBrand, resolveSlttBrand, type SocieteBrand } from "@/lib/societe-brand";

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

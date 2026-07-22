import type { Facture } from "@/lib/store";
import type { Dossier } from "@/lib/domain-types";

export type RattachementKind = "libre" | "dossier" | "facture" | "depense";

export function deriveClientIdFromRattachement(
  rattachementKind: RattachementKind,
  rattachementId: string,
  dossiers: Dossier[],
  factures: Facture[],
): string | undefined {
  if (rattachementKind === "dossier") {
    return dossiers.find((dossier) => dossier.id === rattachementId)?.clientId;
  }
  if (rattachementKind === "facture") {
    return factures.find((facture) => facture.id === rattachementId)?.clientId;
  }
  return undefined;
}

export function deriveSocieteIdFromRattachement(
  rattachementKind: RattachementKind,
  rattachementId: string,
  factures: Facture[],
  depenses: { id: string; societeId?: string }[],
): string | undefined {
  if (rattachementKind === "facture") {
    return factures.find((facture) => facture.id === rattachementId)?.societeId;
  }
  if (rattachementKind === "depense") {
    return depenses.find((depense) => depense.id === rattachementId)?.societeId;
  }
  return undefined;
}

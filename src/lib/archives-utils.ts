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

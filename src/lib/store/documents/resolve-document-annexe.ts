import type { SLTTState } from "@/lib/store";
import { useSession } from "@/lib/session/session-store";
import { requireActiveAnnexeId } from "@/lib/store/connected-user";
import type { AddDocumentInput } from "./types";

export function currentUserId(): string | null {
  return useSession.getState().currentUserId;
}

/**
 * Annexe d'un document : héritée du dossier/facture lié pour rester cohérente
 * avec la donnée qu'il documente (cas dossier-documents-panel, lien connu dès
 * l'upload), sinon repli sur l'annexe active de l'utilisateur (cas OCR
 * "Nouveau dossier via OCR" : le document précède la création du dossier).
 */
export function resolveDocumentAnnexeId(get: () => SLTTState, input: AddDocumentInput): string {
  if (input.dossierId) {
    const fromDossier = get().dossiers.find((d) => d.id === input.dossierId)?.annexeId;
    if (fromDossier) return fromDossier;
  }
  if (input.factureId) {
    const fromFacture = get().factures.find((f) => f.id === input.factureId)?.annexeId;
    if (fromFacture) return fromFacture;
  }
  const userId = currentUserId();
  const userAnnexeIds = get().users.find((u) => u.id === userId)?.annexeIds ?? [];
  return requireActiveAnnexeId(userAnnexeIds);
}

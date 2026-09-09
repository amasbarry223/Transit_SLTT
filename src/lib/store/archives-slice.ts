import type { StateCreator } from "zustand";
import { useSession } from "@/lib/session/session-store";
import type { Archive, TypeDocument } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import { getConnectedUserName, requireActiveAnnexeId } from "@/lib/store/connected-user";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

const ARCHIVES_ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/** Déduit un MIME fiable (certains navigateurs laissent file.type vide). */
export function resolveArchiveMimeType(file: { name: string; type?: string }): string {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  const byExt: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return byExt[ext || ""] || file.type || "application/octet-stream";
}

interface AddArchiveInput {
  nom: string;
  typeDocument: TypeDocument;
  taille: number;
  type: string;
  /** Fichier brut — évite le round-trip dataURL → fetch() qui échoue sur gros fichiers. */
  file: Blob;
  dossierId?: string;
  factureId?: string;
  depenseId?: string;
  clientId?: string;
}


/**
 * Annexe d'une archive : héritée de l'entité liée (dossier/facture/dépense →
 * contrat) pour rester cohérente avec les données qu'elle documente, sinon
 * repli sur l'annexe active de l'utilisateur (archive "libre").
 */
function resolveArchiveAnnexeId(get: () => SLTTState, input: AddArchiveInput): string {
  if (input.dossierId) {
    const fromDossier = get().dossiers.find((d) => d.id === input.dossierId)?.annexeId;
    if (fromDossier) return fromDossier;
  }
  if (input.factureId) {
    const fromFacture = get().factures.find((f) => f.id === input.factureId)?.annexeId;
    if (fromFacture) return fromFacture;
  }
  if (input.depenseId) {
    const depense = get().depenses.find((d) => d.id === input.depenseId);
    const fromContrat = depense
      ? get().contrats.find((c) => c.id === depense.contratId)?.annexeId
      : undefined;
    if (fromContrat) return fromContrat;
  }
  const userId = useSession.getState().currentUserId;
  const userAnnexeIds = get().users.find((u) => u.id === userId)?.annexeIds ?? [];
  return requireActiveAnnexeId(userAnnexeIds, get().annexes);
}

export interface ArchivesSlice {
  archives: Archive[];
  addArchive: (input: AddArchiveInput) => Promise<Archive>;
  deleteArchive: (id: string) => Promise<void>;
  getSignedArchiveUrl: (storagePath: string) => Promise<string>;
}

export const createArchivesSlice: StateCreator<SLTTState, [], [], ArchivesSlice> = (set, get) => ({
  archives: [],

  addArchive: async (input) => {
    const creePar = getConnectedUserName();
    const annexeId = resolveArchiveAnnexeId(get, input);
    const contentType = resolveArchiveMimeType({ name: input.nom, type: input.type || input.file.type });
    if (!ARCHIVES_ALLOWED_MIME.has(contentType)) {
      throw new Error(
        `Type de fichier non accepté (${contentType || "inconnu"}). Formats : PDF, JPEG, PNG, WebP, Word.`,
      );
    }

    const safeName = input.nom.replace(/[^\w.\-]+/g, "_");
    const month = new Date().toISOString().slice(0, 7);
    const path = `${month}/${Date.now()}-${safeName}`;

    const newArchive: Archive = {
      id: crypto.randomUUID(),
      nom: input.nom,
      typeDocument: input.typeDocument,
      taille: input.taille,
      type: contentType,
      storagePath: path,
      dossierId: input.dossierId,
      factureId: input.factureId,
      depenseId: input.depenseId,
      clientId: input.clientId,
      annexeId,
      creePar,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ archives: [newArchive, ...s.archives] }));
    await get().addAuditLog(AUDIT_MODULE.Archives, AUDIT_ACTION.Creation, `Document archivé "${input.nom}" (${input.typeDocument})`);
    return newArchive;
  },

  deleteArchive: async (id) => {
    const archive = get().archives.find((a) => a.id === id);
    set((s) => ({ archives: s.archives.filter((a) => a.id !== id) }));
    if (archive) {
      await get().addAuditLog(AUDIT_MODULE.Archives, AUDIT_ACTION.Suppression, `Document archivé "${archive.nom}" supprimé`);
    }
  },

  getSignedArchiveUrl: async (storagePath) => {
    return storagePath;
  },
});

import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session/session-store";
import type { Archive, TypeDocument } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import type { ArchiveRow } from "@/lib/db-rows";
import { getConnectedUserName, requireActiveAnnexeId } from "@/lib/store/connected-user";

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
  societeId?: string;
}

export function mapArchiveFromDb(x: ArchiveRow): Archive {
  return {
    id: x.id,
    nom: x.nom,
    typeDocument: x.type_document,
    taille: Number(x.taille),
    type: x.mime_type,
    storagePath: x.storage_path,
    dossierId: x.dossier_id || undefined,
    factureId: x.facture_id || undefined,
    depenseId: x.depense_id || undefined,
    clientId: x.client_id || undefined,
    societeId: x.societe_id || undefined,
    annexeId: x.annexe_id,
    creePar: x.cree_par || "",
    createdAt: x.created_at,
  };
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
  return requireActiveAnnexeId(userAnnexeIds);
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

    const { error: uploadError } = await supabase.storage
      .from("archives")
      .upload(path, input.file, { contentType, upsert: false });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("archives")
      .insert({
        nom: input.nom,
        type_document: input.typeDocument,
        taille: input.taille,
        mime_type: contentType,
        storage_path: path,
        dossier_id: input.dossierId || null,
        facture_id: input.factureId || null,
        depense_id: input.depenseId || null,
        client_id: input.clientId || null,
        societe_id: input.societeId || null,
        annexe_id: annexeId,
        cree_par: creePar,
      })
      .select()
      .single();
    if (error) throw error;

    const newArchive = mapArchiveFromDb(data);
    set((s) => ({ archives: [newArchive, ...s.archives] }));
    await get().addAuditLog("Archives", "Création", `Document archivé "${input.nom}" (${input.typeDocument})`);
    return newArchive;
  },

  deleteArchive: async (id) => {
    const archive = get().archives.find((a) => a.id === id);
    if (archive) {
      const { error: storageError } = await supabase.storage.from("archives").remove([archive.storagePath]);
      if (storageError) {
        // Non bloquant : la ligne DB reste la source de vérité de ce qui est
        // "archivé" — on continue la suppression, mais on garde une trace
        // du fichier physique potentiellement orphelin dans le bucket.
        console.error(`[archives] Échec suppression fichier "${archive.nom}" du storage:`, storageError.message);
      }
    }
    const { error } = await supabase.from("archives").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ archives: s.archives.filter((a) => a.id !== id) }));
    if (archive) {
      await get().addAuditLog("Archives", "Suppression", `Document archivé "${archive.nom}" supprimé`);
    }
  },

  getSignedArchiveUrl: async (storagePath) => {
    const { data, error } = await supabase.storage
      .from("archives")
      .createSignedUrl(storagePath, 3600);
    if (error) throw error;
    return data.signedUrl;
  },
});

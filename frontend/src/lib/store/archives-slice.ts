import type { StateCreator } from "zustand";
import { useSession } from "@/lib/session/session-store";
import type { Archive, TypeDocument } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import { getConnectedUserName, requireActiveAnnexeId } from "@/lib/store/connected-user";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";
import { api } from "@/lib/api-client";

const ARCHIVES_ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/** Déduit un MIME fiable (certains navigateurs laissent file.type vide). */
function resolveArchiveMimeType(file: { name: string; type?: string }): string {
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
  type?: string;
  file: File;
  dossierId?: string;
  factureId?: string;
  depenseId?: string;
  clientId?: string;
}

/**
 * Annexe d'une archive : héritée de l'entité liée (dossier/facture/dépense →
 * contrat) pour garantir la cohérence multi-annexes SLTT ; à défaut,
 * repli sur l'annexe active de l'utilisateur (archive "libre").
 */
function resolveArchiveAnnexeId(get: () => SLTTState, input: AddArchiveInput): string {
  if (input.dossierId) {
    const d = get().dossiers.find((x) => x.id === input.dossierId);
    if (d?.annexeId) return d.annexeId;
  }
  if (input.factureId) {
    const f = get().factures.find((x) => x.id === input.factureId);
    if (f?.annexeId) return f.annexeId;
  }
  if (input.depenseId) {
    const dep = get().depenses.find((x) => x.id === input.depenseId);
    if (dep) {
      const c = get().contrats.find((x) => x.id === dep.contratId);
      if (c?.annexeId) return c.annexeId;
    }
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

function getInitialLocalArchives(): Archive[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("transit_sltt_local_archives");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalArchives(archives: Archive[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("transit_sltt_local_archives", JSON.stringify(archives.slice(0, 100)));
  } catch {}
}

export const createArchivesSlice: StateCreator<SLTTState, [], [], ArchivesSlice> = (set, get) => ({
  archives: getInitialLocalArchives(),

  addArchive: async (input) => {
    const creePar = getConnectedUserName();
    const annexeId = resolveArchiveAnnexeId(get, input);
    const contentType = resolveArchiveMimeType({ name: input.nom, type: input.type || input.file.type });
    if (!ARCHIVES_ALLOWED_MIME.has(contentType)) {
      throw new Error(
        `Type de fichier non accepté (${contentType || "inconnu"}). Formats : PDF, JPEG, PNG, WebP, Word.`,
      );
    }

    // 1. Lire en Data URL (base64) pour affichage instantané et garantie offline
    let dataUrl = "";
    if (input.file) {
      try {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(input.file);
        });
      } catch (err) {
        console.warn("Impossible de lire le fichier en dataUrl:", err);
      }
    }

    // 2. Upload effectif sur le serveur NestJS (backend Hostinger)
    let storagePath = dataUrl;
    let uploadedId = "";
    try {
      if (input.file) {
        const uploaded = await api.documents.upload(input.file, input.dossierId);
        if (uploaded?.url) {
          storagePath = uploaded.url;
        }
        if (uploaded?.id) {
          uploadedId = uploaded.id;
        }
      }
    } catch (err) {
      console.warn("Upload de l'archive vers le serveur échoué, repli sur dataUrl:", err);
    }

    // Repli de secours si ni upload ni dataUrl
    if (!storagePath) {
      const safeName = input.nom.replace(/[^\w.\-]+/g, "_");
      const month = new Date().toISOString().slice(0, 7);
      storagePath = `${month}/${Date.now()}-${safeName}`;
    }

    const newArchive: Archive = {
      id: uploadedId || crypto.randomUUID(),
      nom: input.nom,
      typeDocument: input.typeDocument,
      taille: input.taille,
      type: contentType,
      storagePath,
      dataUrl: dataUrl || undefined,
      dossierId: input.dossierId,
      factureId: input.factureId,
      depenseId: input.depenseId,
      clientId: input.clientId,
      annexeId,
      creePar,
      createdAt: new Date().toISOString(),
    };

    const nextArchives = [newArchive, ...get().archives];
    set({ archives: nextArchives });
    saveLocalArchives(nextArchives);

    await get().addAuditLog(AUDIT_MODULE.Archives, AUDIT_ACTION.Creation, `Document archivé "${input.nom}" (${input.typeDocument})`);
    return newArchive;
  },

  deleteArchive: async (id) => {
    const archive = get().archives.find((a) => a.id === id);
    const nextArchives = get().archives.filter((a) => a.id !== id);
    set({ archives: nextArchives });
    saveLocalArchives(nextArchives);

    try {
      await api.documents.delete(id);
    } catch (err) {
      console.warn("Suppression du document distant échouée:", err);
    }

    if (archive) {
      await get().addAuditLog(AUDIT_MODULE.Archives, AUDIT_ACTION.Suppression, `Document archivé "${archive.nom}" supprimé`);
    }
  },

  getSignedArchiveUrl: async (storagePath) => {
    if (!storagePath) return "";
    if (
      storagePath.startsWith("http://") ||
      storagePath.startsWith("https://") ||
      storagePath.startsWith("data:") ||
      storagePath.startsWith("blob:") ||
      storagePath.startsWith("/")
    ) {
      return storagePath;
    }
    if (storagePath.startsWith("api/")) {
      return `/${storagePath}`;
    }
    return storagePath;
  },
});

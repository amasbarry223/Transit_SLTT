import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Archive, TypeDocument } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import { getConnectedUserName } from "@/lib/store/connected-user";

export interface AddArchiveInput {
  nom: string;
  typeDocument: TypeDocument;
  taille: number;
  type: string;
  dataUrl: string;
  dossierId?: string;
  factureId?: string;
  depenseId?: string;
  clientId?: string;
  societeId?: string;
}

export function mapArchiveFromDb(x: any): Archive {
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
    creePar: x.cree_par || "",
    createdAt: x.created_at,
  };
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
    const res = await fetch(input.dataUrl);
    const blob = await res.blob();
    const safeName = input.nom.replace(/[^\w.\-]+/g, "_");
    const month = new Date().toISOString().slice(0, 7);
    const path = `${month}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("archives")
      .upload(path, blob, { contentType: blob.type || "application/octet-stream", upsert: false });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("archives")
      .insert({
        nom: input.nom,
        type_document: input.typeDocument,
        taille: input.taille,
        mime_type: input.type,
        storage_path: path,
        dossier_id: input.dossierId || null,
        facture_id: input.factureId || null,
        depense_id: input.depenseId || null,
        client_id: input.clientId || null,
        societe_id: input.societeId || null,
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

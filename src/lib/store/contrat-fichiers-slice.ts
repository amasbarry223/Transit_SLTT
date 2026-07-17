import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import type { ContratFichier } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";

interface AddContratFichierInput {
  contratId: string;
  nom: string;
  taille: number;
  type: string;
  dataUrl: string;
}

export function mapContratFichierFromDb(x: any): ContratFichier {
  return {
    id: x.id,
    contratId: x.contrat_id,
    nom: x.nom,
    taille: Number(x.taille),
    type: x.type,
    dateUpload: x.date_upload || x.created_at,
    storagePath: x.storage_path,
  };
}

export interface ContratFichiersSlice {
  contratFichiers: ContratFichier[];
  addContratFichier: (input: AddContratFichierInput) => Promise<ContratFichier>;
  deleteContratFichier: (id: string) => Promise<void>;
  getSignedContratFichierUrl: (storagePath: string) => Promise<string>;
}

export const createContratFichiersSlice: StateCreator<SLTTState, [], [], ContratFichiersSlice> = (set, get) => ({
  contratFichiers: [],

  addContratFichier: async (input) => {
    const seq = get().contratFichierSeq;
    const res = await fetch(input.dataUrl);
    const blob = await res.blob();
    const safeName = input.nom.replace(/[^\w.\-]+/g, "_");
    const path = `${input.contratId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("contrat-fichiers")
      .upload(path, blob, { contentType: blob.type || "application/octet-stream", upsert: false });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("contrat_fichiers")
      .insert({
        contrat_id: input.contratId,
        nom: input.nom,
        taille: input.taille,
        type: input.type,
        storage_path: path,
      })
      .select()
      .single();
    if (error) throw error;

    const newFile = mapContratFichierFromDb(data);
    set((s) => ({ contratFichiers: [newFile, ...s.contratFichiers], contratFichierSeq: seq + 1 }));
    return newFile;
  },

  deleteContratFichier: async (id) => {
    const file = get().contratFichiers.find((f) => f.id === id);
    if (file) {
      await supabase.storage.from("contrat-fichiers").remove([file.storagePath]);
    }
    const { error } = await supabase.from("contrat_fichiers").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ contratFichiers: s.contratFichiers.filter((f) => f.id !== id) }));
    if (file) {
      await get().addAuditLog("Contrats", "Suppression", `Fichier "${file.nom}" supprimé`);
    }
  },

  getSignedContratFichierUrl: async (storagePath) => {
    const { data, error } = await supabase.storage
      .from("contrat-fichiers")
      .createSignedUrl(storagePath, 3600);
    if (error) throw error;
    return data.signedUrl;
  },
});

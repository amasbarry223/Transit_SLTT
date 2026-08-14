import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import type { DossierFichier, SubDossier } from "@/lib/domain-types";
import type { FichierInput, SLTTState, SubDossierInput } from "@/lib/store";
import type { DossierFichierRow, SubDossierRow } from "@/lib/db-rows";
import { dataUrlToBlob } from "@/lib/documents/storage";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

export function mapSubDossierFromDb(row: SubDossierRow): SubDossier {
  return {
    id: row.id,
    dossierId: row.dossier_id,
    nom: row.nom,
    description: row.description,
    dateCreation: row.date_creation || new Date().toISOString(),
  };
}

export function mapFichierFromDb(row: DossierFichierRow): DossierFichier {
  return {
    id: row.id,
    dossierId: row.dossier_id,
    sousDossierId: row.sous_dossier_id,
    nom: row.nom,
    taille: Number(row.taille),
    type: row.type,
    dateUpload: row.date_upload || new Date().toISOString(),
    dataUrl: row.data_url,
  };
}

export interface FichiersSlice {
  subDossiers: SubDossier[];
  fichiers: DossierFichier[];
  addSubDossier: (input: SubDossierInput) => Promise<SubDossier>;
  updateSubDossier: (id: string, nom: string, description?: string) => Promise<void>;
  deleteSubDossier: (id: string) => Promise<void>;
  addFichier: (input: FichierInput) => Promise<DossierFichier>;
  deleteFichier: (id: string) => Promise<void>;
  deleteFichiersByDossier: (dossierId: string) => Promise<void>;
}

export const createFichiersSlice: StateCreator<SLTTState, [], [], FichiersSlice> = (set, get) => ({
  subDossiers: [],
  fichiers: [],

  addSubDossier: async (input) => {
    const seq = get().subDossierSeq;

    const { data, error } = await supabase
      .from("sub_dossiers")
      .insert({
        dossier_id: input.dossierId,
        nom: input.nom,
        description: input.description,
      })
      .select()
      .single();

    if (error) throw error;
    const newSd = mapSubDossierFromDb(data);
    set((s) => ({
      subDossiers: [newSd, ...s.subDossiers],
      subDossierSeq: seq + 1,
    }));
    await get().addAuditLog(AUDIT_MODULE.Dossiers, AUDIT_ACTION.Creation, `Sous-dossier "${newSd.nom}" créé`);
    return newSd;
  },

  updateSubDossier: async (id, nom, description) => {
    const { error } = await supabase
      .from("sub_dossiers")
      .update({ nom, description })
      .eq("id", id);
    if (error) throw error;

    set((s) => ({
      subDossiers: s.subDossiers.map((sd) =>
        sd.id === id ? { ...sd, nom, description } : sd,
      ),
    }));
    await get().addAuditLog(AUDIT_MODULE.Dossiers, AUDIT_ACTION.Modification, `Sous-dossier "${nom}" modifié`);
  },

  deleteSubDossier: async (id) => {
    const subDossier = get().subDossiers.find((sd) => sd.id === id);

    const { error } = await supabase.from("sub_dossiers").delete().eq("id", id);
    if (error) throw error;

    set((s) => ({
      subDossiers: s.subDossiers.filter((sd) => sd.id !== id),
      fichiers: s.fichiers.filter((f) => f.sousDossierId !== id),
    }));
    if (subDossier) {
      await get().addAuditLog(AUDIT_MODULE.Dossiers, AUDIT_ACTION.Suppression, `Sous-dossier "${subDossier.nom}" supprimé`);
    }
  },

  addFichier: async (input) => {
    const seq = get().fichierSeq;

    let storedUrl = input.dataUrl;
    if (input.dataUrl.startsWith("data:")) {
      try {
        const blob = await dataUrlToBlob(input.dataUrl);
        const safeName = input.nom.replace(/[^\w.\-]+/g, "_");
        const path = `${input.dossierId}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("dossier-fichiers")
          .upload(path, blob, {
            contentType: blob.type || "application/octet-stream",
            upsert: false,
          });
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("dossier-fichiers")
            .getPublicUrl(path);
          storedUrl = urlData.publicUrl;
        }
      } catch {
        // Conserver data_url en secours si le bucket n'est pas configuré
      }
    }

    const { data, error } = await supabase
      .from("dossier_fichiers")
      .insert({
        dossier_id: input.dossierId,
        sous_dossier_id: input.sousDossierId,
        nom: input.nom,
        taille: input.taille,
        type: input.type,
        data_url: storedUrl,
      })
      .select()
      .single();

    if (error) throw error;
    const newFile = mapFichierFromDb(data);
    set((s) => ({
      fichiers: [newFile, ...s.fichiers],
      fichierSeq: seq + 1,
    }));
    await get().addAuditLog(AUDIT_MODULE.Dossiers, AUDIT_ACTION.Creation, `Fichier "${newFile.nom}" ajouté`);
    return newFile;
  },

  deleteFichier: async (id) => {
    const fichier = get().fichiers.find((f) => f.id === id);

    const { error } = await supabase.from("dossier_fichiers").delete().eq("id", id);
    if (error) throw error;

    set((s) => ({
      fichiers: s.fichiers.filter((f) => f.id !== id),
    }));
    if (fichier) {
      await get().addAuditLog(AUDIT_MODULE.Dossiers, AUDIT_ACTION.Suppression, `Fichier "${fichier.nom}" supprimé`);
    }
  },

  deleteFichiersByDossier: async (dossierId) => {
    const { error } = await supabase.from("dossier_fichiers").delete().eq("dossier_id", dossierId);
    if (error) throw error;

    set((s) => ({
      fichiers: s.fichiers.filter((f) => f.dossierId !== dossierId),
    }));
  },
});

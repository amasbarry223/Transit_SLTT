import type { StateCreator } from "zustand";
import type { DossierFichier, SubDossier } from "@/lib/domain-types";
import type { FichierInput, SLTTState, SubDossierInput } from "@/lib/store";
import type { DossierFichierRow, SubDossierRow } from "@/lib/db-rows";
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

    const newSd: SubDossier = {
      id: crypto.randomUUID(),
      dossierId: input.dossierId,
      nom: input.nom,
      description: input.description,
      dateCreation: new Date().toISOString(),
    };
    set((s) => ({
      subDossiers: [newSd, ...s.subDossiers],
      subDossierSeq: seq + 1,
    }));
    await get().addAuditLog(AUDIT_MODULE.Dossiers, AUDIT_ACTION.Creation, `Sous-dossier "${newSd.nom}" créé`);
    return newSd;
  },

  updateSubDossier: async (id, nom, description) => {
    set((s) => ({
      subDossiers: s.subDossiers.map((sd) =>
        sd.id === id ? { ...sd, nom, description } : sd,
      ),
    }));
    await get().addAuditLog(AUDIT_MODULE.Dossiers, AUDIT_ACTION.Modification, `Sous-dossier "${nom}" modifié`);
  },

  deleteSubDossier: async (id) => {
    const subDossier = get().subDossiers.find((sd) => sd.id === id);

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

    const newFile: DossierFichier = {
      id: crypto.randomUUID(),
      dossierId: input.dossierId,
      sousDossierId: input.sousDossierId,
      nom: input.nom,
      taille: input.taille,
      type: input.type,
      dateUpload: new Date().toISOString(),
      dataUrl: input.dataUrl,
    };
    set((s) => ({
      fichiers: [newFile, ...s.fichiers],
      fichierSeq: seq + 1,
    }));
    await get().addAuditLog(AUDIT_MODULE.Dossiers, AUDIT_ACTION.Creation, `Fichier "${newFile.nom}" ajouté`);
    return newFile;
  },

  deleteFichier: async (id) => {
    const fichier = get().fichiers.find((f) => f.id === id);

    set((s) => ({
      fichiers: s.fichiers.filter((f) => f.id !== id),
    }));
    if (fichier) {
      await get().addAuditLog(AUDIT_MODULE.Dossiers, AUDIT_ACTION.Suppression, `Fichier "${fichier.nom}" supprimé`);
    }
  },

  deleteFichiersByDossier: async (dossierId) => {
    set((s) => ({
      fichiers: s.fichiers.filter((f) => f.dossierId !== dossierId),
    }));
  },
});

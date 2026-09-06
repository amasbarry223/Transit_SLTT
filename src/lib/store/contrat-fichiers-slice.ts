import type { StateCreator } from "zustand";
import type { ContratFichier } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import type { ContratFichierRow } from "@/lib/db-rows";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

interface AddContratFichierInput {
  contratId: string;
  nom: string;
  taille: number;
  type: string;
  dataUrl: string;
}

export function mapContratFichierFromDb(row: ContratFichierRow): ContratFichier {
  return {
    id: row.id,
    contratId: row.contrat_id,
    nom: row.nom,
    taille: Number(row.taille),
    type: row.type,
    dateUpload: row.date_upload || row.created_at,
    storagePath: row.storage_path,
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
    const safeName = input.nom.replace(/[^\w.\-]+/g, "_");
    const path = `${input.contratId}/${Date.now()}-${safeName}`;

    const newFile: ContratFichier = {
      id: crypto.randomUUID(),
      contratId: input.contratId,
      nom: input.nom,
      taille: input.taille,
      type: input.type,
      dateUpload: new Date().toISOString(),
      storagePath: input.dataUrl || path,
    };
    set((s) => ({ contratFichiers: [newFile, ...s.contratFichiers], contratFichierSeq: seq + 1 }));
    await get().addAuditLog(AUDIT_MODULE.Contrats, AUDIT_ACTION.Creation, `Fichier "${newFile.nom}" ajouté`);
    return newFile;
  },

  deleteContratFichier: async (id) => {
    const file = get().contratFichiers.find((f) => f.id === id);
    set((s) => ({ contratFichiers: s.contratFichiers.filter((f) => f.id !== id) }));
    if (file) {
      await get().addAuditLog(AUDIT_MODULE.Contrats, AUDIT_ACTION.Suppression, `Fichier "${file.nom}" supprimé`);
    }
  },

  getSignedContratFichierUrl: async (storagePath) => {
    return storagePath; // dataUrl or direct path
  },
});

import type { StateCreator } from "zustand";
import { api } from "@/lib/api-client";
import type { Societe, SocieteInput } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import type { SocieteRow } from "@/lib/db-rows";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

export function mapSocieteFromDb(row: SocieteRow): Societe {
  return {
    id: row.id,
    nom: row.nom,
    raisonSociale: row.raison_sociale || undefined,
    actif: row.actif,
    logoUrl: row.logo_url || undefined,
    adresse: row.adresse || undefined,
    telephone: row.telephone || undefined,
    rccm: row.rccm || undefined,
    nif: row.nif || undefined,
    afficherNomAvecLogo: row.afficher_nom_avec_logo ?? true,
    signataireDg: row.signataire_dg || undefined,
    signatairePdg: row.signataire_pdg || undefined,
  };
}

export interface SocietesSlice {
  societes: Societe[];
  updateSociete: (id: string, input: SocieteInput) => Promise<void>;
  /** Envoie le fichier vers le stockage serveur NestJS et renvoie son URL. */
  uploadSocieteLogo: (id: string, file: File) => Promise<string>;
}

export const createSocietesSlice: StateCreator<SLTTState, [], [], SocietesSlice> = (set, get) => ({
  societes: [],

  updateSociete: async (id, input) => {
    try {
      await api.settings.setMany({
        societe_nom: input.nom,
        societe_logo_url: input.logoUrl || "",
        societe_adresse: input.adresse || "",
        societe_telephone: input.telephone || "",
        societe_rccm: input.rccm || "",
        societe_nif: input.nif || "",
        societe_signataire_dg: input.signataireDg || "",
        societe_signataire_pdg: input.signatairePdg || "",
        societe_afficher_nom_avec_logo: String(input.afficherNomAvecLogo ?? true),
      });
    } catch (e) {
      console.warn("api.settings.setMany a échoué (mode local) :", e);
    }

    set((s) => ({
      societes: s.societes.map((soc) =>
        soc.id === id
          ? {
              ...soc,
              nom: input.nom,
              logoUrl: input.logoUrl,
              adresse: input.adresse,
              telephone: input.telephone,
              rccm: input.rccm,
              nif: input.nif,
              signataireDg: input.signataireDg,
              signatairePdg: input.signatairePdg,
              afficherNomAvecLogo: input.afficherNomAvecLogo ?? soc.afficherNomAvecLogo,
            }
          : soc,
      ),
    }));
    await get().addAuditLog(AUDIT_MODULE.Societes, AUDIT_ACTION.Modification, `Société ${input.nom} mise à jour`);
  },

  uploadSocieteLogo: async (_id, file) => {
    try {
      const res = await api.documents.upload(file);
      if (res && res.url) {
        return res.url;
      }
    } catch {
      // repli en local si besoin
    }
    return URL.createObjectURL(file);
  },
});

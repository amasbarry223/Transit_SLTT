import type { StateCreator } from "zustand";
import { api } from "@/lib/api-client";
import type { Societe, SocieteInput } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";
import { DEFAULT_TRANSIT_BRAND, LEGACY_TRANSIT_SOCIETE_ID } from "@/lib/societe-brand";

/** Dérivé de DEFAULT_TRANSIT_BRAND (source unique de repli, societe-brand.ts)
 *  plutôt que d'un jeu de valeurs dupliqué — avant ce commit, ce repli
 *  ("Transit SLTT", Bamako Niaréla, RCCM Ma.Bko.2025 B.5897) et
 *  DEFAULT_TRANSIT_BRAND ("TRAORE DE LOGISTIQUE", RCCM MA.BKO.2024.B.1234)
 *  affichaient deux identités société différentes selon l'écran. */
const DEFAULT_SOCIETE: Societe = {
  id: LEGACY_TRANSIT_SOCIETE_ID,
  nom: DEFAULT_TRANSIT_BRAND.nom,
  raisonSociale: DEFAULT_TRANSIT_BRAND.raisonSociale,
  actif: true,
  logoUrl: DEFAULT_TRANSIT_BRAND.logoUrl,
  adresse: DEFAULT_TRANSIT_BRAND.legal?.adresse,
  telephone: DEFAULT_TRANSIT_BRAND.legal?.telephone,
  rccm: DEFAULT_TRANSIT_BRAND.legal?.rccm,
  nif: DEFAULT_TRANSIT_BRAND.legal?.nif,
  afficherNomAvecLogo: DEFAULT_TRANSIT_BRAND.afficherNomAvecLogo ?? true,
};

export interface SocietesSlice {
  societes: Societe[];
  updateSociete: (id: string, input: SocieteInput) => Promise<void>;
  /** Envoie le fichier vers le stockage serveur NestJS et renvoie son URL. */
  uploadSocieteLogo: (id: string, file: File) => Promise<string>;
}

export const createSocietesSlice: StateCreator<SLTTState, [], [], SocietesSlice> = (set, get) => ({
  societes: [DEFAULT_SOCIETE],

  updateSociete: async (id, input) => {
    // Persistance obligatoire : sans elle, l'identité société affichée
    // (nom, logo, adresse légale imprimée sur les documents officiels)
    // divergeait silencieusement de ce qui est réellement enregistré, sans
    // aucune erreur montrée à l'utilisateur.
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
    // Un échec d'upload renvoyait un blob: URL local en repli, accepté par
    // l'appelant (societe-tab.tsx) comme une réussite ("Logo envoyé") — cette
    // URL n'existe que dans cet onglet, ne survit même pas à un rechargement
    // de page, et aurait été enregistrée telle quelle en base si l'utilisateur
    // cliquait ensuite sur Enregistrer : un logo cassé pour tout le monde sauf
    // l'auteur, jusqu'à son prochain F5. On propage l'erreur à la place.
    const res = await api.documents.upload(file);
    if (!res?.url) {
      throw new Error("Le serveur n'a pas renvoyé d'URL pour ce fichier.");
    }
    return res.url;
  },
});

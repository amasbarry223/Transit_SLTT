import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Societe, SocieteInput } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import type { SocieteRow } from "@/lib/db-rows";

export function mapSocieteFromDb(x: SocieteRow): Societe {
  return {
    id: x.id,
    nom: x.nom,
    actif: x.actif,
    logoUrl: x.logo_url || undefined,
    adresse: x.adresse || undefined,
    telephone: x.telephone || undefined,
    rccm: x.rccm || undefined,
    nif: x.nif || undefined,
    afficherNomAvecLogo: x.afficher_nom_avec_logo ?? true,
    signataireDg: x.signataire_dg || undefined,
    signatairePdg: x.signataire_pdg || undefined,
    isTransit: x.is_transit ?? undefined,
  };
}

export interface SocietesSlice {
  societes: Societe[];
  updateSociete: (id: string, input: SocieteInput) => Promise<void>;
  /** Envoie le fichier vers le bucket public societe-logos et renvoie son URL publique (ne persiste pas seule — combiner avec updateSociete). */
  uploadSocieteLogo: (id: string, file: File) => Promise<string>;
}

export const createSocietesSlice: StateCreator<SLTTState, [], [], SocietesSlice> = (set, get) => ({
  societes: [],

  updateSociete: async (id, input) => {
    const { error } = await supabase
      .from("societes")
      .update({
        nom: input.nom,
        logo_url: input.logoUrl || null,
        adresse: input.adresse || null,
        telephone: input.telephone || null,
        rccm: input.rccm || null,
        nif: input.nif || null,
        signataire_dg: input.signataireDg || null,
        signataire_pdg: input.signatairePdg || null,
        // `?? true` (et non `|| true`) : false est une valeur valide et
        // voulue ici, contrairement aux champs texte ci-dessus où vide
        // doit devenir null.
        afficher_nom_avec_logo: input.afficherNomAvecLogo ?? true,
      })
      .eq("id", id);
    if (error) throw error;

    set((s) => ({
      societes: s.societes.map((soc) => (soc.id === id ? { ...soc, ...input } : soc)),
    }));
    await get().addAuditLog("Sociétés", "Modification", `Société ${input.nom} mise à jour`);
  },

  uploadSocieteLogo: async (id, file) => {
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${id}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("societe-logos")
      .upload(path, file, { contentType: file.type || "image/png", upsert: false });
    if (uploadError) throw uploadError;

    // Bucket public (societe-logos) : URL stable, pas de signature à
    // renouveler — nécessaire puisque le logo est référencé depuis des
    // documents imprimés (fenêtres ouvertes hors session applicative).
    const { data } = supabase.storage.from("societe-logos").getPublicUrl(path);
    return data.publicUrl;
  },
});

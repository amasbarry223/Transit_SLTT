import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
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
  /** Envoie le fichier vers le bucket public societe-logos et renvoie son URL publique (ne persiste pas seule — combiner avec updateSociete). */
  uploadSocieteLogo: (id: string, file: File) => Promise<string>;
}

export const createSocietesSlice: StateCreator<SLTTState, [], [], SocietesSlice> = (set, get) => ({
  societes: [],

  updateSociete: async (id, input) => {
    const { data, error } = await supabase
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
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    // Re-dérive depuis la réponse serveur (au lieu de fusionner l'input
    // client tel quel) — même pattern que les autres slices : reflète tout
    // défaut/normalisation appliqué côté base plutôt que de supposer que ce
    // qu'on a envoyé est exactement ce qui a été persisté.
    const updated = mapSocieteFromDb(data as SocieteRow);
    set((s) => ({
      societes: s.societes.map((soc) => (soc.id === id ? updated : soc)),
    }));
    await get().addAuditLog(AUDIT_MODULE.Societes, AUDIT_ACTION.Modification, `Société ${input.nom} mise à jour`);
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

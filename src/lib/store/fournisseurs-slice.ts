import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import { syncFournisseurStats } from "@/lib/fournisseur-stats";
import type { DossierFournisseur, DossierFournisseurInput, Fournisseur, FournisseurInput } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import type { DossierFournisseurRow, FournisseurRow } from "@/lib/db-rows";

export function mapFournisseurFromDb(x: FournisseurRow): Fournisseur {
  return {
    id: x.id,
    nom: x.nom,
    type: x.type,
    contact: x.contact,
    telephone: x.telephone,
    email: x.email || "",
    adresse: x.adresse || "",
    tarifContractuel: x.tarif_contractuel ? Number(x.tarif_contractuel) : undefined,
    nbDossiers: 0,
    montantTotal: 0,
    statut: x.statut,
  };
}

export function mapDossierFournisseurFromDb(x: DossierFournisseurRow): DossierFournisseur {
  return {
    id: x.id,
    dossierId: x.dossier_id,
    dossierRef: x.dossiers?.reference || undefined,
    fournisseurId: x.fournisseur_id,
    fournisseurNom: x.fournisseurs?.nom || "",
    // NOTE: "Transport" n'est pas un FournisseurType valide (voir domain-types.ts) — comportement
    // préexistant conservé tel quel ; assertion nécessaire pour ne pas masquer le vrai bug derrière `any`.
    type: x.fournisseurs?.type || ("Transport" as DossierFournisseur["type"]),
    description: x.description,
    montantBudgete: Number(x.montant_budgete),
    montantReel: Number(x.montant_reel),
    statut: x.statut,
    date: x.date || new Date().toISOString().slice(0, 10),
  };
}

/** Retire l'apport d'une liste de DossierFournisseur des agrégats du Fournisseur parent (LOGIC-04). */
function decrementFournisseurAgg(fournisseurs: Fournisseur[], removed: DossierFournisseur[]): Fournisseur[] {
  if (removed.length === 0) return fournisseurs;
  const deltaByFournisseur = new Map<string, { count: number; montant: number }>();
  for (const df of removed) {
    const prev = deltaByFournisseur.get(df.fournisseurId) ?? { count: 0, montant: 0 };
    deltaByFournisseur.set(df.fournisseurId, { count: prev.count + 1, montant: prev.montant + df.montantReel });
  }
  return fournisseurs.map((f) => {
    const delta = deltaByFournisseur.get(f.id);
    if (!delta) return f;
    return {
      ...f,
      nbDossiers: Math.max(0, f.nbDossiers - delta.count),
      montantTotal: Math.max(0, f.montantTotal - delta.montant),
    };
  });
}

export interface FournisseursSlice {
  fournisseurs: Fournisseur[];
  dossierFournisseurs: DossierFournisseur[];
  addFournisseur: (input: FournisseurInput) => Promise<Fournisseur>;
  updateFournisseur: (id: string, input: FournisseurInput) => Promise<void>;
  removeFournisseur: (id: string) => Promise<void>;
  addDossierFournisseur: (input: DossierFournisseurInput) => Promise<DossierFournisseur>;
  updateDossierFournisseur: (id: string, input: Partial<DossierFournisseurInput>) => Promise<void>;
  removeDossierFournisseur: (id: string) => Promise<void>;
}

export const createFournisseursSlice: StateCreator<SLTTState, [], [], FournisseursSlice> = (set, get) => ({
  fournisseurs: [],
  dossierFournisseurs: [],

  addFournisseur: async (input) => {
    const seq = get().fournisseurSeq;

    const { data, error } = await supabase
      .from("fournisseurs")
      .insert({
        nom: input.nom,
        type: input.type,
        contact: input.contact,
        telephone: input.telephone,
        email: input.email,
        adresse: input.adresse,
        tarif_contractuel: input.tarifContractuel,
        statut: input.statut || "Actif",
      })
      .select()
      .single();

    if (error) throw error;
    const newFourn = mapFournisseurFromDb(data);
    set((s) => ({
      fournisseurs: [newFourn, ...s.fournisseurs],
      fournisseurSeq: seq + 1,
    }));
    await get().addAuditLog("Fournisseurs", "Création", `Fournisseur ${input.nom} créé`);
    return newFourn;
  },
  updateFournisseur: async (id, input) => {
    const { error } = await supabase
      .from("fournisseurs")
      .update({
        nom: input.nom,
        type: input.type,
        contact: input.contact,
        telephone: input.telephone,
        email: input.email,
        adresse: input.adresse,
        tarif_contractuel: input.tarifContractuel,
        statut: input.statut,
      })
      .eq("id", id);
    if (error) throw error;

    set((s) => ({
      fournisseurs: s.fournisseurs.map((f) => (f.id === id ? { ...f, ...input } : f)),
    }));
    await get().addAuditLog("Fournisseurs", "Modification", `Fournisseur ${input.nom} mis à jour`);
  },

  removeFournisseur: async (id) => {
    const fourn = get().fournisseurs.find((f) => f.id === id);
    const { error } = await supabase.from("fournisseurs").delete().eq("id", id);
    if (error) throw error;

    set((s) => ({
      fournisseurs: s.fournisseurs.filter((f) => f.id !== id),
      dossierFournisseurs: s.dossierFournisseurs.filter((df) => df.fournisseurId !== id),
    }));

    if (fourn) {
      await get().addAuditLog("Fournisseurs", "Suppression", `Fournisseur ${fourn.nom} supprimé`);
    }
  },

  addDossierFournisseur: async (input) => {
    const seq = get().dossierFournisseurSeq;

    const { data, error } = await supabase
      .from("dossier_fournisseurs")
      .insert({
        dossier_id: input.dossierId,
        fournisseur_id: input.fournisseurId,
        description: input.description,
        montant_budgete: input.montantBudgete,
        montant_reel: input.montantReel,
        statut: input.statut || "En attente",
        date: input.date,
      })
      .select("*, fournisseurs(nom, type), dossiers(reference)")
      .single();

    if (error) throw error;
    const newDf = mapDossierFournisseurFromDb(data);
    set((s) => {
      const updatedDf = [newDf, ...s.dossierFournisseurs];
      return {
        dossierFournisseurs: updatedDf,
        dossierFournisseurSeq: seq + 1,
        fournisseurs: syncFournisseurStats(updatedDf, s.fournisseurs),
      };
    });
    return newDf;
  },

  updateDossierFournisseur: async (id, input) => {
    const { error } = await supabase
      .from("dossier_fournisseurs")
      .update({
        dossier_id: input.dossierId,
        fournisseur_id: input.fournisseurId,
        description: input.description,
        montant_budgete: input.montantBudgete,
        montant_reel: input.montantReel,
        statut: input.statut,
        date: input.date,
      })
      .eq("id", id);
    if (error) throw error;

    set((s) => {
      const updatedDf = s.dossierFournisseurs.map((df) => (df.id === id ? { ...df, ...input } : df));
      return {
        dossierFournisseurs: updatedDf,
        fournisseurs: syncFournisseurStats(updatedDf, s.fournisseurs),
      };
    });
  },

  removeDossierFournisseur: async (id) => {
    const { error } = await supabase.from("dossier_fournisseurs").delete().eq("id", id);
    if (error) throw error;

    set((s) => {
      const updatedDf = s.dossierFournisseurs.filter((df) => df.id !== id);
      return {
        dossierFournisseurs: updatedDf,
        fournisseurs: syncFournisseurStats(updatedDf, s.fournisseurs),
      };
    });
  },
});

import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import { syncFournisseurStats } from "@/lib/fournisseur-stats";
import { requireActiveAnnexeId } from "@/lib/store/connected-user";
import { useSession } from "@/lib/session/session-store";
import type { DossierFournisseur, DossierFournisseurInput, Fournisseur, FournisseurInput } from "@/lib/domain-types";
import type { SLTTState } from "@/lib/store";
import type { DossierFournisseurRow, FournisseurRow } from "@/lib/db-rows";

export function mapFournisseurFromDb(row: FournisseurRow): Fournisseur {
  return {
    id: row.id,
    nom: row.nom,
    type: row.type,
    contact: row.contact,
    telephone: row.telephone,
    email: row.email || "",
    adresse: row.adresse || "",
    tarifContractuel: row.tarif_contractuel ? Number(row.tarif_contractuel) : undefined,
    nbDossiers: 0,
    montantTotal: 0,
    statut: row.statut,
    annexeId: row.annexe_id,
  };
}

export function mapDossierFournisseurFromDb(row: DossierFournisseurRow): DossierFournisseur {
  return {
    id: row.id,
    dossierId: row.dossier_id,
    dossierRef: row.dossiers?.reference || undefined,
    fournisseurId: row.fournisseur_id,
    fournisseurNom: row.fournisseurs?.nom || "",
    // NOTE: "Transport" n'est pas un FournisseurType valide (voir domain-types.ts) — comportement
    // préexistant conservé tel quel ; assertion nécessaire pour ne pas masquer le vrai bug derrière `any`.
    type: row.fournisseurs?.type || ("Transport" as DossierFournisseur["type"]),
    description: row.description,
    montantBudgete: Number(row.montant_budgete),
    montantReel: Number(row.montant_reel),
    statut: row.statut,
    date: row.date || new Date().toISOString().slice(0, 10),
  };
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
    const userId = useSession.getState().currentUserId;
    const annexeId = requireActiveAnnexeId(get().users.find((u) => u.id === userId)?.annexeIds ?? []);

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
        annexe_id: annexeId,
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
    await get().addAuditLog(
      "Fournisseurs",
      "Création",
      `Lien fournisseur ${newDf.fournisseurNom} ↔ dossier ${newDf.dossierRef ?? newDf.dossierId} créé`,
    );
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
    await get().addAuditLog("Fournisseurs", "Modification", `Lien fournisseur ↔ dossier modifié`);
  },

  removeDossierFournisseur: async (id) => {
    const target = get().dossierFournisseurs.find((df) => df.id === id);
    const { error } = await supabase.from("dossier_fournisseurs").delete().eq("id", id);
    if (error) throw error;

    set((s) => {
      const updatedDf = s.dossierFournisseurs.filter((df) => df.id !== id);
      return {
        dossierFournisseurs: updatedDf,
        fournisseurs: syncFournisseurStats(updatedDf, s.fournisseurs),
      };
    });
    if (target) {
      await get().addAuditLog(
        "Fournisseurs",
        "Suppression",
        `Lien fournisseur ${target.fournisseurNom} ↔ dossier ${target.dossierRef ?? target.dossierId} supprimé`,
      );
    }
  },
});

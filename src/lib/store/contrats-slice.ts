import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import { getConnectedUserName } from "@/lib/store/connected-user";
import { syncContratStats } from "@/lib/contrat-stats";
import type {
  Contrat,
  ContratInput,
  ContratStatut,
  ContratPrestation,
  ContratPrestationInput,
  Depense,
} from "@/lib/domain-types";
import type { AddDepenseInput, SLTTState } from "@/lib/store";
import type { ContratPrestationRow, ContratRow, DepenseRow } from "@/lib/db-rows";

function pad(n: number, len: number): string {
  return String(n).padStart(len, "0");
}

export function mapContratFromDb(
  x: ContratRow,
): Omit<Contrat, "nbPrestations" | "nbPrestationsRealisees" | "totalDepenses"> {
  return {
    id: x.id,
    reference: x.reference,
    societeId: x.societe_id,
    societeNom: x.societes?.nom || "—",
    clientId: x.client_id,
    clientNom: x.clients?.nom || "—",
    objet: x.objet,
    dateDebut: x.date_debut,
    dateFin: x.date_fin || undefined,
    montant: Number(x.montant),
    statut: x.statut,
    notes: x.notes || undefined,
    creePar: x.cree_par || undefined,
    creeLe: x.created_at,
  };
}

export function mapDepenseFromDb(x: DepenseRow): Depense {
  return {
    id: x.id,
    contratId: x.contrat_id,
    societeId: x.societe_id,
    libelle: x.libelle,
    montant: Number(x.montant),
    dateDepense: x.date_depense,
    modePaiement: x.mode_paiement,
    justificatifPath: x.justificatif_path || undefined,
    note: x.note || undefined,
    creePar: x.cree_par || undefined,
  };
}

export function mapContratPrestationFromDb(x: ContratPrestationRow): ContratPrestation {
  return {
    id: x.id,
    contratId: x.contrat_id,
    libelle: x.libelle,
    description: x.description || undefined,
    montant: x.montant != null ? Number(x.montant) : undefined,
    statut: x.statut,
    datePrevue: x.date_prevue || undefined,
    dateRealisation: x.date_realisation || undefined,
    creePar: x.cree_par || undefined,
  };
}

export interface ContratsSlice {
  contrats: Contrat[];
  depenses: Depense[];
  contratPrestations: ContratPrestation[];
  addContrat: (input: ContratInput) => Promise<Contrat>;
  updateContrat: (id: string, input: ContratInput) => Promise<void>;
  updateContratStatut: (id: string, statut: ContratStatut) => Promise<void>;
  removeContrat: (id: string) => Promise<void>;
  getContrat: (id: string) => Contrat | undefined;
  addDepense: (input: AddDepenseInput) => Promise<Depense>;
  removeDepense: (id: string) => Promise<void>;
  addContratPrestation: (input: ContratPrestationInput) => Promise<ContratPrestation>;
  updateContratPrestation: (id: string, input: Partial<ContratPrestationInput>) => Promise<void>;
  removeContratPrestation: (id: string) => Promise<void>;
}

export const createContratsSlice: StateCreator<SLTTState, [], [], ContratsSlice> = (set, get) => ({
  contrats: [],
  depenses: [],
  contratPrestations: [],

  addContrat: async (input) => {
    const seq = get().contratSeq;
    const year = new Date().getFullYear();
    const reference = `CTR-${year}-${pad(seq, 4)}`;
    const creePar = getConnectedUserName();

    const { data, error } = await supabase
      .from("contrats")
      .insert({
        reference,
        societe_id: input.societeId,
        client_id: input.clientId,
        objet: input.objet,
        date_debut: input.dateDebut,
        date_fin: input.dateFin || null,
        montant: input.montant,
        statut: input.statut,
        notes: input.notes || null,
        cree_par: creePar,
      })
      .select("*, clients(nom), societes(nom)")
      .single();

    if (error) throw error;
    const raw = mapContratFromDb(data);
    set((s) => ({
      contrats: syncContratStats(s.depenses, s.contratPrestations, [raw, ...s.contrats]),
      contratSeq: seq + 1,
    }));
    await get().addAuditLog("Contrats", "Création", `Contrat ${reference} créé — ${input.clientNom}`);
    return get().contrats.find((c) => c.id === raw.id)!;
  },

  updateContrat: async (id, input) => {
    const { error } = await supabase
      .from("contrats")
      .update({
        societe_id: input.societeId,
        client_id: input.clientId,
        objet: input.objet,
        date_debut: input.dateDebut,
        date_fin: input.dateFin || null,
        montant: input.montant,
        statut: input.statut,
        notes: input.notes || null,
      })
      .eq("id", id);
    if (error) throw error;

    const existing = get().contrats.find((c) => c.id === id);
    const societeChanged = !!existing && existing.societeId !== input.societeId;

    // La société d'une dépense est dénormalisée depuis son contrat à la
    // création (perf/simplicité de lecture) — si le contrat change de
    // société, il faut recaler les dépenses déjà créées pour ne pas
    // fausser silencieusement le Bénéfice par société.
    if (societeChanged) {
      const { error: depensesError } = await supabase
        .from("depenses")
        .update({ societe_id: input.societeId })
        .eq("contrat_id", id);
      if (depensesError) throw depensesError;
    }

    set((s) => ({
      contrats: s.contrats.map((c) =>
        c.id === id
          ? { ...c, ...input, clientNom: input.clientNom }
          : c,
      ),
      depenses: societeChanged
        ? s.depenses.map((d) => (d.contratId === id ? { ...d, societeId: input.societeId } : d))
        : s.depenses,
    }));
    if (existing) {
      await get().addAuditLog(
        "Contrats",
        "Modification",
        societeChanged
          ? `Contrat ${existing.reference} modifié — société changée, dépenses liées recalées`
          : `Contrat ${existing.reference} modifié`,
      );
    }
  },

  updateContratStatut: async (id, statut) => {
    const { error } = await supabase.from("contrats").update({ statut }).eq("id", id);
    if (error) throw error;
    const existing = get().contrats.find((c) => c.id === id);
    set((s) => ({ contrats: s.contrats.map((c) => (c.id === id ? { ...c, statut } : c)) }));
    if (existing) {
      await get().addAuditLog("Contrats", "Modification", `Contrat ${existing.reference} → ${statut}`);
    }
  },

  removeContrat: async (id) => {
    const contrat = get().contrats.find((c) => c.id === id);
    if (!contrat) return;

    // Garde client-side — message clair AVANT l'appel réseau. La contrainte FK
    // (NO ACTION sur depenses.contrat_id / contrat_prestations.contrat_id) est
    // la garde de dernier recours côté DB en cas de course (2 onglets, etc.).
    const depensesLiees = get().depenses.filter((d) => d.contratId === id).length;
    const prestationsLiees = get().contratPrestations.filter((p) => p.contratId === id).length;
    if (depensesLiees > 0 || prestationsLiees > 0) {
      throw new Error(
        `Impossible de supprimer le contrat ${contrat.reference} : il porte ${depensesLiees} dépense(s) et ${prestationsLiees} prestation(s). Retirez-les d'abord.`,
      );
    }

    const fichiersLies = get().contratFichiers.filter((f) => f.contratId === id);
    if (fichiersLies.length > 0) {
      const { error: storageErr } = await supabase.storage
        .from("contrat-fichiers")
        .remove(fichiersLies.map((f) => f.storagePath));
      if (storageErr) throw storageErr;
      const { error: fichiersErr } = await supabase
        .from("contrat_fichiers")
        .delete()
        .eq("contrat_id", id);
      if (fichiersErr) throw fichiersErr;
    }

    const { error } = await supabase.from("contrats").delete().eq("id", id);
    if (error) throw error;

    set((s) => ({
      contrats: s.contrats.filter((c) => c.id !== id),
      contratFichiers: s.contratFichiers.filter((f) => f.contratId !== id),
    }));
    await get().addAuditLog("Contrats", "Suppression", `Contrat ${contrat.reference} supprimé`);
  },

  getContrat: (id) => get().contrats.find((c) => c.id === id),

  // ---- Dépenses ----
  addDepense: async (input) => {
    const seq = get().depenseSeq;
    const contrat = get().contrats.find((c) => c.id === input.contratId);
    if (!contrat) throw new Error("Contrat introuvable.");
    const creePar = getConnectedUserName();

    let justificatifPath: string | undefined;
    if (input.justificatifDataUrl && input.justificatifNom) {
      const res = await fetch(input.justificatifDataUrl);
      const blob = await res.blob();
      const safeName = input.justificatifNom.replace(/[^\w.\-]+/g, "_");
      justificatifPath = `${input.contratId}/depenses/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("contrat-fichiers")
        .upload(justificatifPath, blob, { contentType: blob.type || "application/octet-stream", upsert: false });
      if (uploadError) throw uploadError;
    }

    const { data, error } = await supabase
      .from("depenses")
      .insert({
        contrat_id: input.contratId,
        societe_id: contrat.societeId,
        libelle: input.libelle,
        montant: input.montant,
        date_depense: input.dateDepense,
        mode_paiement: input.modePaiement,
        justificatif_path: justificatifPath || null,
        note: input.note || null,
        cree_par: creePar,
      })
      .select()
      .single();
    if (error) throw error;

    const newDepense = mapDepenseFromDb(data);
    set((s) => {
      const updatedDepenses = [newDepense, ...s.depenses];
      return {
        depenses: updatedDepenses,
        depenseSeq: seq + 1,
        contrats: syncContratStats(updatedDepenses, s.contratPrestations, s.contrats),
      };
    });
    await get().addAuditLog(
      "Dépenses",
      "Création",
      `Dépense "${input.libelle}" (${input.montant.toLocaleString("fr-FR")} FCFA) — contrat ${contrat.reference}`,
    );
    return newDepense;
  },

  removeDepense: async (id) => {
    const depense = get().depenses.find((d) => d.id === id);
    if (depense?.justificatifPath) {
      await supabase.storage.from("contrat-fichiers").remove([depense.justificatifPath]);
    }
    const { error } = await supabase.from("depenses").delete().eq("id", id);
    if (error) throw error;
    set((s) => {
      const updatedDepenses = s.depenses.filter((d) => d.id !== id);
      return {
        depenses: updatedDepenses,
        contrats: syncContratStats(updatedDepenses, s.contratPrestations, s.contrats),
      };
    });
    if (depense) {
      await get().addAuditLog("Dépenses", "Suppression", `Dépense "${depense.libelle}" supprimée`);
    }
  },

  // ---- Prestations optionnelles ----
  addContratPrestation: async (input) => {
    const seq = get().contratPrestationSeq;
    const creePar = getConnectedUserName();
    const { data, error } = await supabase
      .from("contrat_prestations")
      .insert({
        contrat_id: input.contratId,
        libelle: input.libelle,
        description: input.description || null,
        montant: input.montant ?? null,
        statut: input.statut,
        date_prevue: input.datePrevue || null,
        date_realisation: input.dateRealisation || null,
        cree_par: creePar,
      })
      .select()
      .single();
    if (error) throw error;

    const newPrestation = mapContratPrestationFromDb(data);
    set((s) => {
      const updated = [newPrestation, ...s.contratPrestations];
      return {
        contratPrestations: updated,
        contratPrestationSeq: seq + 1,
        contrats: syncContratStats(s.depenses, updated, s.contrats),
      };
    });
    return newPrestation;
  },

  updateContratPrestation: async (id, input) => {
    const { error } = await supabase
      .from("contrat_prestations")
      .update({
        libelle: input.libelle,
        description: input.description,
        montant: input.montant,
        statut: input.statut,
        date_prevue: input.datePrevue,
        date_realisation: input.dateRealisation,
      })
      .eq("id", id);
    if (error) throw error;

    set((s) => {
      const updated = s.contratPrestations.map((p) => (p.id === id ? { ...p, ...input } : p));
      return { contratPrestations: updated, contrats: syncContratStats(s.depenses, updated, s.contrats) };
    });
  },

  removeContratPrestation: async (id) => {
    const { error } = await supabase.from("contrat_prestations").delete().eq("id", id);
    if (error) throw error;
    set((s) => {
      const updated = s.contratPrestations.filter((p) => p.id !== id);
      return { contratPrestations: updated, contrats: syncContratStats(s.depenses, updated, s.contrats) };
    });
  },
});

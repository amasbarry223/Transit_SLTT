import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import { canTransitionDevis } from "@/lib/status-flow";
import type { Devis, DevisStatut, Dossier } from "@/lib/domain-types";
import type { DevisInput, DossierInput, SLTTState } from "@/lib/store";
import type { DevisRow } from "@/lib/db-rows";

function pad(n: number, len: number): string {
  return String(n).padStart(len, "0");
}

export function mapDevisFromDb(x: DevisRow): Devis {
  return {
    id: x.id,
    reference: x.reference,
    clientId: x.client_id,
    clientNom: x.clients?.nom || "—",
    nature: x.nature,
    droitDouane: Number(x.droit_douane),
    fraisCircuit: Number(x.frais_circuit),
    fraisPrestation: Number(x.frais_prestation),
    total: Number(x.total),
    statut: x.statut,
    dateCreation: x.date_creation,
    dateValidite: x.date_validite,
    notes: x.notes || undefined,
  };
}

export interface DevisSlice {
  devis: Devis[];
  addDevis: (input: DevisInput) => Promise<Devis>;
  updateDevis: (id: string, input: DevisInput) => Promise<void>;
  updateDevisStatut: (id: string, statut: DevisStatut) => Promise<void>;
  expireDevisObsoletes: () => Promise<void>;
  convertDevisToDossier: (id: string, bl: string, camion: string) => Promise<Dossier | null>;
  removeDevis: (id: string) => Promise<void>;
}

export const createDevisSlice: StateCreator<SLTTState, [], [], DevisSlice> = (set, get) => ({
  devis: [],

  addDevis: async (input) => {
    const seq = get().devisSeq;
    const year = new Date().getFullYear();
    const reference = `DEVIS-${year}-${pad(seq, 4)}`;

    const total = Number(input.droitDouane) + Number(input.fraisCircuit) + Number(input.fraisPrestation);

    const { data, error } = await supabase
      .from("devis")
      .insert({
        reference,
        client_id: input.clientId,
        nature: input.nature,
        droit_douane: input.droitDouane,
        frais_circuit: input.fraisCircuit,
        frais_prestation: input.fraisPrestation,
        total,
        statut: "Brouillon",
        date_validite: input.dateValidite,
        notes: input.notes,
      })
      .select("*, clients(nom)")
      .single();

    if (error) throw error;
    const newDevis = mapDevisFromDb(data);
    set((s) => ({
      devis: [newDevis, ...s.devis],
      devisSeq: seq + 1,
    }));
    await get().addAuditLog("Devis", "Création", `Devis ${reference} créé — Client ${newDevis.clientNom}`);
    return newDevis;
  },

  updateDevis: async (id, input) => {
    const total = Number(input.droitDouane) + Number(input.fraisCircuit) + Number(input.fraisPrestation);

    const { error } = await supabase
      .from("devis")
      .update({
        client_id: input.clientId,
        nature: input.nature,
        droit_douane: input.droitDouane,
        frais_circuit: input.fraisCircuit,
        frais_prestation: input.fraisPrestation,
        total,
        date_validite: input.dateValidite,
        notes: input.notes,
      })
      .eq("id", id);
    if (error) throw error;

    const existing = get().devis.find((d) => d.id === id);
    set((s) => ({
      devis: s.devis.map((d) =>
        d.id === id
          ? {
              ...d,
              ...input,
              total,
            }
          : d
      ),
    }));
    if (existing) {
      await get().addAuditLog("Devis", "Modification", `Devis ${existing.reference} modifié`);
    }
  },

  updateDevisStatut: async (id, statut) => {
    const existingBefore = get().devis.find((d) => d.id === id);
    if (existingBefore && !canTransitionDevis(existingBefore.statut, statut)) {
      throw new Error(`Transition non autorisée : ${existingBefore.statut} → ${statut}.`);
    }

    const { error } = await supabase
      .from("devis")
      .update({ statut })
      .eq("id", id);
    if (error) throw error;

    const existing = get().devis.find((d) => d.id === id);
    set((s) => ({
      devis: s.devis.map((d) => (d.id === id ? { ...d, statut } : d)),
    }));
    if (existing) {
      await get().addAuditLog("Devis", "Modification", `Devis ${existing.reference} → ${statut}`);
    }
  },

  expireDevisObsoletes: async () => {
    const today = new Date().toISOString().slice(0, 10);
    const obsoletes = get().devis.filter(
      (d) => d.dateValidite < today && d.statut !== "Accepté" && d.statut !== "Refusé" && d.statut !== "Expiré"
    );

    if (obsoletes.length === 0) return;

    await supabase
      .from("devis")
      .update({ statut: "Expiré" })
      .in("id", obsoletes.map((o) => o.id));

    set((s) => ({
      devis: s.devis.map((d) =>
        d.dateValidite < today && d.statut !== "Accepté" && d.statut !== "Refusé"
          ? { ...d, statut: "Expiré" as DevisStatut }
          : d
      ),
    }));
    await get().addAuditLog(
      "Devis",
      "Modification",
      `${obsoletes.length} devis expiré${obsoletes.length !== 1 ? "s" : ""} automatiquement`,
    );
  },

  convertDevisToDossier: async (id, bl, camion) => {
    const dev = get().devis.find((d) => d.id === id);
    if (!dev || dev.dossierId) return null; // déjà converti — pas de doublon
    if (dev.statut !== "Accepté") {
      throw new Error("Seul un devis Accepté peut être converti en dossier.");
    }

    const inputDossier: DossierInput = {
      clientId: dev.clientId,
      clientNom: dev.clientNom,
      nature: dev.nature || `Devis ${dev.reference} : ${dev.notes || "transit"}`,
      bl,
      camion,
      date: new Date().toISOString().slice(0, 10),
      droitDouane: dev.droitDouane,
      fraisCircuit: dev.fraisCircuit,
      fraisPrestation: dev.fraisPrestation,
      montantInvesti: dev.total,
      statut: "En cours",
      notes: dev.notes,
    };

    const newDossier = await get().addDossier(inputDossier);

    // Update the devis status and link it to the new dossier
    const { error } = await supabase
      .from("devis")
      .update({ statut: "Accepté", dossier_id: newDossier.id })
      .eq("id", id);
    if (error) throw error;

    set((s) => ({
      devis: s.devis.map((d) =>
        d.id === id ? { ...d, statut: "Accepté", dossierId: newDossier.id } : d
      ),
    }));

    await get().addAuditLog(
      "Devis",
      "Validation",
      `Devis ${dev.reference} converti en dossier ${newDossier.reference}`,
    );
    return newDossier;
  },

  removeDevis: async (id) => {
    const existing = get().devis.find((d) => d.id === id);
    const { error } = await supabase.from("devis").delete().eq("id", id);
    if (error) throw error;

    set((s) => ({
      devis: s.devis.filter((d) => d.id !== id),
    }));
    if (existing) {
      await get().addAuditLog("Devis", "Suppression", `Devis ${existing.reference} supprimé`);
    }
  },
});

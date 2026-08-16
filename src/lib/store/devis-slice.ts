import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session/session-store";
import { canTransitionDevis } from "@/lib/status-flow";
import type { Devis, DevisStatut, Dossier } from "@/lib/domain-types";
import type { DevisInput, DossierInput, SLTTState } from "@/lib/store";
import { mapDevisFromDb } from "@/features/devis/services/devis-mapper";
import { resolveTransitSociete } from "@/lib/societe-brand";
import { requireActiveAnnexeId } from "@/lib/store/connected-user";
import type { DevisRow } from "@/lib/db-rows";
import {
  computeAnnexeScopedReference,
  extractTrailingSeq,
  insertWithReferenceRetry,
} from "@/lib/store/reference";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";
import { logError } from "@/shared/logger";

export { mapDevisFromDb };

function currentUserAnnexeIds(get: () => SLTTState): string[] {
  const userId = useSession.getState().currentUserId;
  return get().users.find((u) => u.id === userId)?.annexeIds ?? [];
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
    if (!input.societeId?.trim()) {
      throw new Error("La société est obligatoire pour créer un devis.");
    }
    const client = get().clients.find((c) => c.id === input.clientId);
    const annexeId = client?.annexeId ?? requireActiveAnnexeId(currentUserAnnexeIds(get));
    const societe = get().societes.find((s) => s.id === input.societeId);
    const annexe = get().annexes.find((a) => a.id === annexeId);
    const { reference: initialReference, useAnnexeNumbering } = computeAnnexeScopedReference(
      societe,
      annexe,
      "DEVIS",
      get().devis.map((d) => d.reference),
      get().devisSeq,
    );

    const total = Number(input.droitDouane) + Number(input.fraisCircuit) + Number(input.fraisPrestation);

    // Retry avec référence incrémentée si deux créations concurrentes ont
    // calculé la même référence à partir d'un même snapshot client (contrainte unique en base).
    const { data, reference } = await insertWithReferenceRetry<DevisRow>(initialReference, (ref) =>
      supabase
        .from("devis")
        .insert({
          reference: ref,
          client_id: input.clientId,
          societe_id: input.societeId,
          annexe_id: annexeId,
          nature: input.nature,
          droit_douane: input.droitDouane,
          frais_circuit: input.fraisCircuit,
          frais_prestation: input.fraisPrestation,
          total,
          statut: "Brouillon",
          date_validite: input.dateValidite,
          notes: input.notes,
        })
        .select("*, clients(nom), societes(nom), annexes(nom)")
        .single(),
    );

    const newDevis = mapDevisFromDb(data);
    const finalSeq = extractTrailingSeq(reference) ?? get().devisSeq;
    set((s) => ({
      devis: [newDevis, ...s.devis],
      devisSeq: useAnnexeNumbering ? s.devisSeq : finalSeq + 1,
    }));
    await get().addAuditLog(AUDIT_MODULE.Devis, AUDIT_ACTION.Creation, `Devis ${reference} créé — Client ${newDevis.clientNom}`);
    return newDevis;
  },

  updateDevis: async (id, input) => {
    if (!input.societeId?.trim()) {
      throw new Error("La société est obligatoire.");
    }
    const total = Number(input.droitDouane) + Number(input.fraisCircuit) + Number(input.fraisPrestation);
    const societeNom =
      get().societes.find((s) => s.id === input.societeId)?.nom ||
      get().devis.find((d) => d.id === id)?.societeNom ||
      "—";

    const { error } = await supabase
      .from("devis")
      .update({
        client_id: input.clientId,
        societe_id: input.societeId,
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
      devis: s.devis.map((devisItem) =>
        devisItem.id === id
          ? {
              ...devisItem,
              ...input,
              societeNom,
              total,
            }
          : devisItem
      ),
    }));
    if (existing) {
      await get().addAuditLog(AUDIT_MODULE.Devis, AUDIT_ACTION.Modification, `Devis ${existing.reference} modifié`);
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
      await get().addAuditLog(AUDIT_MODULE.Devis, AUDIT_ACTION.Modification, `Devis ${existing.reference} → ${statut}`);
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
      devis: s.devis.map((devisItem) =>
        devisItem.dateValidite < today &&
        devisItem.statut !== "Accepté" &&
        devisItem.statut !== "Refusé"
          ? { ...devisItem, statut: "Expiré" as DevisStatut }
          : devisItem
      ),
    }));
    await get().addAuditLog(
      AUDIT_MODULE.Devis,
      AUDIT_ACTION.Modification,
      `${obsoletes.length} devis expiré${obsoletes.length !== 1 ? "s" : ""} automatiquement`,
    );
  },

  convertDevisToDossier: async (id, bl, camion) => {
    const dev = get().devis.find((d) => d.id === id);
    if (!dev || dev.dossierId) return null; // déjà converti — pas de doublon
    if (dev.statut !== "Accepté") {
      throw new Error("Seul un devis Accepté peut être converti en dossier.");
    }

    const transit = resolveTransitSociete(get().societes);
    const societeId = dev.societeId || transit?.id;
    if (!societeId) {
      throw new Error("Aucune société configurée. Renseignez-la dans Paramètres > Sociétés.");
    }

    const annexeId =
      dev.annexeId ||
      requireActiveAnnexeId(
        get().users.find((u) => u.id === useSession.getState().currentUserId)?.annexeIds ?? [],
      );

    const inputDossier: DossierInput = {
      societeId,
      annexeId,
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

    // Deux écritures séquentielles (insert dossier + lien devis) : en cas d'échec
    // du lien, on compense en supprimant le dossier pour éviter un orphelin.
    // Le lien passe par une RPC atomique (WHERE dossier_id IS NULL côté serveur)
    // pour qu'une conversion concurrente du même devis échoue explicitement au
    // lieu d'écraser silencieusement le premier dossier créé (course TOCTOU).
    const newDossier = await get().addDossier(inputDossier);

    try {
      const { error } = await supabase.rpc("link_devis_to_dossier", {
        p_devis_id: id,
        p_dossier_id: newDossier.id,
      });
      if (error) throw error;
    } catch (linkError) {
      try {
        await get().removeDossier(newDossier.id);
      } catch (rollbackError) {
        logError(
          "Rollback conversion devis→dossier échoué : dossier orphelin à purger manuellement",
          rollbackError,
          { dossierId: newDossier.id, devisId: id },
        );
      }
      throw linkError;
    }

    set((s) => ({
      devis: s.devis.map((devisItem) =>
        devisItem.id === id ? { ...devisItem, statut: "Accepté", dossierId: newDossier.id } : devisItem
      ),
    }));

    await get().addAuditLog(
      AUDIT_MODULE.Devis,
      AUDIT_ACTION.Validation,
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
      await get().addAuditLog(AUDIT_MODULE.Devis, AUDIT_ACTION.Suppression, `Devis ${existing.reference} supprimé`);
    }
  },
});

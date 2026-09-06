import type { StateCreator } from "zustand";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useSession } from "@/lib/session/session-store";
import { canTransitionDevis } from "@/lib/status-flow";
import type { Devis, DevisStatut, Dossier } from "@/lib/domain-types";
import type { DevisInput, DossierInput, SLTTState } from "@/lib/store";
import { mapDevisFromDb } from "@/features/devis/services/devis-mapper";
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
    const client = get().clients.find((c) => c.id === input.clientId);
    const annexeId = client?.annexeId ?? requireActiveAnnexeId(currentUserAnnexeIds(get));
    const annexe = get().annexes.find((a) => a.id === annexeId);
    const { reference: initialReference, useAnnexeNumbering } = computeAnnexeScopedReference(
      undefined,
      annexe,
      "DEVIS",
      get().devis.map((d) => d.reference),
      get().devisSeq,
    );

    const total = Number(input.droitDouane) + Number(input.fraisCircuit) + Number(input.fraisPrestation);

    if (!isSupabaseConfigured) {
      // Mode NestJS : appel API REST
      const { api } = await import("@/lib/api-client");
      const created = await api.devis.create({
        numero: initialReference,
        clientId: input.clientId,
        dateValidite: input.dateValidite ? new Date(input.dateValidite) : undefined,
        notes: input.notes,
        lignes: [
          { designation: "Droit de douane", quantite: 1, prixUnitaire: input.droitDouane },
          { designation: "Frais de circuit", quantite: 1, prixUnitaire: input.fraisCircuit },
          { designation: "Frais de prestation", quantite: 1, prixUnitaire: input.fraisPrestation },
        ],
      });
      const clientNom = client?.nom ?? (input as any).clientNom ?? "—";
      const newDevis: Devis = {
        id: created.id,
        reference: created.numero ?? initialReference,
        clientId: input.clientId,
        clientNom,
        annexeId: annexeId ?? "",
        annexeNom: annexe?.nom ?? "",
        nature: input.nature ?? "",
        droitDouane: Number(input.droitDouane),
        fraisCircuit: Number(input.fraisCircuit),
        fraisPrestation: Number(input.fraisPrestation),
        total,
        statut: "Brouillon",
        dateCreation: new Date().toISOString().slice(0, 10),
        dateValidite: input.dateValidite ?? "",
        notes: input.notes,
      };
      const finalSeq = extractTrailingSeq(newDevis.reference) ?? get().devisSeq;
      set((s) => ({
        devis: [newDevis, ...s.devis],
        devisSeq: useAnnexeNumbering ? s.devisSeq : finalSeq + 1,
      }));
      await get().addAuditLog(AUDIT_MODULE.Devis, AUDIT_ACTION.Creation, `Devis ${newDevis.reference} créé — Client ${clientNom}`);
      return newDevis;
    }

    // Mode Supabase
    const { data, reference } = await insertWithReferenceRetry<DevisRow>(initialReference, (ref) =>
      supabase
        .from("devis")
        .insert({
          reference: ref,
          client_id: input.clientId,
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
        .select("*, clients(nom), annexes(nom)")
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
    const total = Number(input.droitDouane) + Number(input.fraisCircuit) + Number(input.fraisPrestation);

    if (!isSupabaseConfigured) {
      const existing = get().devis.find((d) => d.id === id);
      set((s) => ({
        devis: s.devis.map((devisItem) =>
          devisItem.id === id ? { ...devisItem, ...input, total } : devisItem
        ),
      }));
      if (existing) {
        await get().addAuditLog(AUDIT_MODULE.Devis, AUDIT_ACTION.Modification, `Devis ${existing.reference} modifié`);
      }
      return;
    }

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
      devis: s.devis.map((devisItem) =>
        devisItem.id === id
          ? { ...devisItem, ...input, total }
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

    if (!isSupabaseConfigured) {
      const existing = get().devis.find((d) => d.id === id);
      set((s) => ({
        devis: s.devis.map((d) => (d.id === id ? { ...d, statut } : d)),
      }));
      if (existing) {
        await get().addAuditLog(AUDIT_MODULE.Devis, AUDIT_ACTION.Modification, `Devis ${existing.reference} → ${statut}`);
      }
      return;
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

    if (!isSupabaseConfigured) {
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
      return;
    }

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

    if (!get().societes[0]) {
      throw new Error("Aucune société configurée. Renseignez-la dans Paramètres > Sociétés.");
    }

    const annexeId =
      dev.annexeId ||
      requireActiveAnnexeId(
        get().users.find((u) => u.id === useSession.getState().currentUserId)?.annexeIds ?? [],
      );

    const inputDossier: DossierInput = {
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

    const newDossier = await get().addDossier(inputDossier);

    if (!isSupabaseConfigured) {
      // Mode NestJS : lien local uniquement
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
    }

    // Mode Supabase : RPC atomique (WHERE dossier_id IS NULL) pour éviter les races TOCTOU
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

    if (!isSupabaseConfigured) {
      set((s) => ({
        devis: s.devis.filter((d) => d.id !== id),
      }));
      if (existing) {
        await get().addAuditLog(AUDIT_MODULE.Devis, AUDIT_ACTION.Suppression, `Devis ${existing.reference} supprimé`);
      }
      return;
    }

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

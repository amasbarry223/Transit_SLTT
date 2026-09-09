import { logWarn } from "@/shared/logger";
import type { StateCreator } from "zustand";
import { api } from "@/lib/api-client";
import { useSession } from "@/lib/session/session-store";
import { canTransitionDevis } from "@/lib/status-flow";
import type { Devis, DevisStatut, Dossier } from "@/lib/domain-types";
import type { DevisInput, DossierInput, SLTTState } from "@/lib/store";
import { mapDevisFromDb } from "@/features/devis/services/devis-mapper";
import { requireActiveAnnexeId } from "@/lib/store/connected-user";
import {
  computeAnnexeScopedReference,
  extractTrailingSeq,
} from "@/lib/store/reference";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

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
    const annexeId = client?.annexeId ?? requireActiveAnnexeId(currentUserAnnexeIds(get), get().annexes);
    const annexe = get().annexes.find((a) => a.id === annexeId);
    const { reference: initialReference, useAnnexeNumbering } = computeAnnexeScopedReference(
      undefined,
      annexe,
      "DEVIS",
      get().devis.map((d) => d.reference),
      get().devisSeq,
    );

    const total = Number(input.droitDouane) + Number(input.fraisCircuit) + Number(input.fraisPrestation);

    let createdId = crypto.randomUUID();
    let createdNumero = initialReference;

    try {
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
      if (created?.id) createdId = created.id;
      if (created?.numero) createdNumero = created.numero;
    } catch (e) {
      logWarn("api.devis.create (mode local)", e);
    }

    const clientNom = client?.nom ?? (input as any).clientNom ?? "—";
    const newDevis: Devis = {
      id: createdId,
      reference: createdNumero,
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
  },

  updateDevis: async (id, input) => {
    const total = Number(input.droitDouane) + Number(input.fraisCircuit) + Number(input.fraisPrestation);
    const existing = get().devis.find((d) => d.id === id);

    try {
      await api.devis.update(id, {
        clientId: input.clientId,
        dateValidite: input.dateValidite ? new Date(input.dateValidite) : undefined,
        notes: input.notes,
        lignes: [
          { designation: "Droit de douane", quantite: 1, prixUnitaire: input.droitDouane },
          { designation: "Frais de circuit", quantite: 1, prixUnitaire: input.fraisCircuit },
          { designation: "Frais de prestation", quantite: 1, prixUnitaire: input.fraisPrestation },
        ],
      });
    } catch (e) {
      logWarn("api.devis.update (mode local)", e);
    }

    set((s) => ({
      devis: s.devis.map((devisItem) =>
        devisItem.id === id ? { ...devisItem, ...input, total } : devisItem
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

    try {
      const dbStatut =
        statut === "Accepté" ? "ACCEPTE" : statut === "Refusé" ? "REFUSE" : statut === "Expiré" ? "EXPIRE" : "BROUILLON";
      await api.devis.update(id, { statut: dbStatut });
    } catch (e) {
      logWarn("api.devis.update statut (mode local)", e);
    }

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

    for (const d of obsoletes) {
      try {
        await api.devis.update(d.id, { statut: "EXPIRE" });
      } catch {}
    }

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
        get().annexes,
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

    try {
      await api.devis.update(id, { statut: "ACCEPTE" });
    } catch {}

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

    try {
      await api.devis.delete(id);
    } catch (e) {
      logWarn("api.devis.delete (mode local)", e);
    }

    set((s) => ({
      devis: s.devis.filter((d) => d.id !== id),
    }));
    if (existing) {
      await get().addAuditLog(AUDIT_MODULE.Devis, AUDIT_ACTION.Suppression, `Devis ${existing.reference} supprimé`);
    }
  },
});

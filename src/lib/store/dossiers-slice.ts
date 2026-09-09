import { logWarn } from "@/shared/logger";
import type { StateCreator } from "zustand";
import { api } from "@/lib/api-client";
import { syncClientStats } from "@/lib/client-stats";
import { syncFournisseurStats } from "@/lib/fournisseur-stats";
import { assertDossierTransition } from "@/lib/dossier-flow";
import { resolveDossierReferencePrefix } from "@/lib/societe-brand";
import {
  DOSSIER_STATUT_DEDOUANE,
  DOSSIER_STATUT_EN_COURS,
  DOSSIER_STATUT_SOLDE,
} from "@/lib/constants";
import { resteAPayer, type Dossier, type DossierStatut, type PaiementMode } from "@/lib/domain-types";
import type { DossierInput, ImportDossierHistoriqueInput, SLTTState } from "@/lib/store";
import {
  shouldSyncEcritureOnDossierSolde,
  syncEcritureWhenDossierSolde,
} from "@/lib/store/sync-helpers";
import {
  computeDossierReference,
  computeHistoricalDossierReference,
  extractTrailingSeq,
  bumpTrailingSeq,
} from "@/lib/store/reference";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

export interface DossiersSlice {
  dossiers: Dossier[];
  addDossier: (input: DossierInput) => Promise<Dossier>;
  importDossierHistorique: (input: ImportDossierHistoriqueInput) => Promise<Dossier>;
  updateDossier: (id: string, input: DossierInput) => Promise<void>;
  removeDossier: (id: string) => Promise<void>;
  getDossier: (id: string) => Dossier | undefined;
  transitionDossier: (
    id: string,
    newStatut: DossierStatut,
    montantRecu?: number,
    modePaiement?: PaiementMode,
    transitionNote?: string,
    effectiveDate?: string,
  ) => Promise<void>;
}

/** Génère la prochaine référence dossier (numérotation par code d'annexe). */
function resolveDossierReference(
  get: () => SLTTState,
  annexeId: string,
  year: number,
): { reference: string; useAnnexeNumbering: boolean; seq: number } {
  const societe = get().societes[0];
  const annexe = get().annexes.find((item) => item.id === annexeId);
  const prefix = societe?.nom?.trim() || resolveDossierReferencePrefix(get().societes);
  return computeDossierReference(
    undefined,
    annexe,
    prefix,
    get().dossiers.map((dossier) => dossier.reference),
    get().dossierSeq,
    year,
  );
}

export const createDossiersSlice: StateCreator<SLTTState, [], [], DossiersSlice> = (set, get) => ({
  dossiers: [],

  addDossier: async (input) => {
    const year = new Date().getFullYear();
    const annexe = get().annexes.find((item) => item.id === input.annexeId);
    const { reference: initialReference, useAnnexeNumbering } = resolveDossierReference(
      get,
      input.annexeId,
      year,
    );

    // Si la référence est déjà prise localement (créations simultanées), on bump
    let reference = initialReference;
    let safetyCount = 0;
    while (get().dossiers.some((item) => item.reference === reference) && safetyCount < 10) {
      reference = bumpTrailingSeq(reference);
      safetyCount++;
    }

    const statut = DOSSIER_STATUT_EN_COURS;
    const newDossier: Dossier = {
      id: crypto.randomUUID(),
      reference,
      annexeId: input.annexeId,
      annexeNom: annexe?.nom,
      clientId: input.clientId,
      clientNom: input.clientNom,
      bl: input.bl,
      camion: input.camion,
      nature: input.nature,
      droitDouane: input.droitDouane,
      fraisCircuit: input.fraisCircuit,
      fraisPrestation: input.fraisPrestation,
      montantInvesti: input.montantInvesti,
      montantPaye: 0,
      statut,
      date: input.date,
      dateEcheance: input.dateEcheance,
      dateDedouanement: input.dateDedouanement,
      modeTransport: input.modeTransport,
      noConteneur: input.noConteneur,
      portEntree: input.portEntree,
      poidsTotal: input.poidsTotal,
      notes: input.notes,
    };

    try {
      const created = await api.dossiers.create({
        numero: reference,
        annexeId: input.annexeId,
        clientId: input.clientId,
        marchandise: input.nature,
        valeurDouane: input.droitDouane,
        numeroBl: input.bl,
        notes: input.notes,
        voieTransport: input.modeTransport,
        modeTransport: input.modeTransport,
        poids: input.poidsTotal,
        poidsTotal: input.poidsTotal,
        navireVol: input.camion,
        camion: input.camion,
        portDestination: input.portEntree,
        portEntree: input.portEntree,
        dateDepart: input.date,
        date: input.date,
        dateArriveePrevue: input.dateEcheance,
        dateEcheance: input.dateEcheance,
        dateArriveeEffective: input.dateDedouanement,
        dateDedouanement: input.dateDedouanement,
        noConteneur: input.noConteneur,
        conteneurs: input.noConteneur ? [{ numero: input.noConteneur }] : undefined,
      });
      if (created?.id) {
        newDossier.id = created.id;
      }
    } catch (e) {
      logWarn("api.dossiers.create (mode local/déconnecté)", e);
    }

    const finalSeq = extractTrailingSeq(reference) ?? get().dossierSeq;
    set((s) => {
      const updatedDossiers = [newDossier, ...s.dossiers];
      return {
        dossiers: updatedDossiers,
        dossierSeq: useAnnexeNumbering ? s.dossierSeq : finalSeq + 1,
        clients: syncClientStats(updatedDossiers, s.factures, s.ecritures, s.clients),
      };
    });
    await get().addAuditLog(
      AUDIT_MODULE.Dossiers,
      AUDIT_ACTION.Creation,
      `Dossier ${reference} créé — Client ${input.clientNom}`,
      input.clientId,
      { sourceType: "dossier", sourceId: newDossier.id },
    );
    return newDossier;
  },

  importDossierHistorique: async (input) => {
    const year = Number(input.date.slice(0, 4)) || new Date().getFullYear();
    const societe = get().societes[0];
    const annexe = get().annexes.find((item) => item.id === input.annexeId);
    const prefix = societe?.nom?.trim() || resolveDossierReferencePrefix(get().societes);
    const { reference } = computeHistoricalDossierReference(
      undefined,
      annexe,
      prefix,
      get().dossiers.map((dossier) => dossier.reference),
      year,
    );

    const newDossier: Dossier = {
      id: crypto.randomUUID(),
      reference,
      annexeId: input.annexeId,
      annexeNom: annexe?.nom,
      clientId: input.clientId,
      clientNom: input.clientNom,
      bl: "",
      camion: "",
      nature: input.nature,
      droitDouane: 0,
      fraisCircuit: 0,
      fraisPrestation: input.montantInvesti,
      montantInvesti: input.montantInvesti,
      montantPaye: input.montantPaye,
      statut: input.statut,
      date: input.date,
      notes: input.notes,
    };

    try {
      const created = await api.dossiers.create({
        numero: reference,
        annexeId: input.annexeId,
        clientId: input.clientId,
        marchandise: input.nature,
        notes: input.notes,
      });
      if (created?.id) {
        newDossier.id = created.id;
      }
    } catch (e) {
      logWarn("api.dossiers.create historique (mode local)", e);
    }

    set((s) => {
      const updatedDossiers = [newDossier, ...s.dossiers];
      return {
        dossiers: updatedDossiers,
        clients: syncClientStats(updatedDossiers, s.factures, s.ecritures, s.clients),
      };
    });
    await get().addAuditLog(
      AUDIT_MODULE.Dossiers,
      AUDIT_ACTION.Creation,
      `Dossier ${reference} importé (historique) — Client ${input.clientNom}` +
        (input.montantPaye > 0
          ? ` — ${input.montantPaye.toLocaleString("fr-FR")} FCFA déjà réglés`
          : ""),
      input.clientId,
      { sourceType: "dossier", sourceId: newDossier.id },
    );
    return newDossier;
  },

  updateDossier: async (id, input) => {
    const existing = get().dossiers.find((dossier) => dossier.id === id);
    if (!existing) {
      throw new Error("Dossier introuvable localement — rafraîchissez la page avant de modifier ce dossier.");
    }
    const statut = existing.statut;
    const annexeNom =
      get().annexes.find((item) => item.id === input.annexeId)?.nom ||
      existing?.annexeNom;

    try {
      await api.dossiers.update(id, {
        annexeId: input.annexeId,
        clientId: input.clientId,
        marchandise: input.nature,
        valeurDouane: input.droitDouane,
        numeroBl: input.bl,
        notes: input.notes,
        voieTransport: input.modeTransport,
        modeTransport: input.modeTransport,
        poids: input.poidsTotal,
        poidsTotal: input.poidsTotal,
        navireVol: input.camion,
        camion: input.camion,
        portDestination: input.portEntree,
        portEntree: input.portEntree,
        dateDepart: input.date,
        date: input.date,
        dateArriveePrevue: input.dateEcheance,
        dateEcheance: input.dateEcheance,
        dateArriveeEffective: input.dateDedouanement,
        dateDedouanement: input.dateDedouanement,
        noConteneur: input.noConteneur,
        conteneurs: input.noConteneur ? [{ numero: input.noConteneur }] : undefined,
      });
    } catch (e) {
      logWarn("api.dossiers.update (mode local)", e);
    }

    set((s) => {
      const updatedDossiers = s.dossiers.map((dossier) =>
        dossier.id === id
          ? { ...dossier, ...input, statut, annexeId: input.annexeId, annexeNom }
          : dossier,
      );
      return {
        dossiers: updatedDossiers,
        clients: syncClientStats(updatedDossiers, s.factures, s.ecritures, s.clients),
      };
    });

    await get().addAuditLog(
      AUDIT_MODULE.Dossiers,
      AUDIT_ACTION.Modification,
      `Dossier ${existing.reference} modifié`,
      existing.clientId,
      { sourceType: "dossier", sourceId: id },
    );
  },

  removeDossier: async (id) => {
    const dossier = get().dossiers.find((item) => item.id === id);

    try {
      await api.dossiers.delete(id);
    } catch (e) {
      logWarn("api.dossiers.delete (mode local)", e);
    }

    set((s) => {
      const updatedDossiers = s.dossiers.filter((item) => item.id !== id);
      const updatedDossierFournisseurs = s.dossierFournisseurs.filter(
        (dossierFournisseur) => dossierFournisseur.dossierId !== id,
      );
      return {
        dossiers: updatedDossiers,
        clients: syncClientStats(updatedDossiers, s.factures, s.ecritures, s.clients),
        ecritures: s.ecritures.map((ecriture) =>
          ecriture.dossierId === id ? { ...ecriture, dossierId: undefined } : ecriture,
        ),
        fichiers: s.fichiers.filter((fichier) => fichier.dossierId !== id),
        subDossiers: s.subDossiers.filter((subDossier) => subDossier.dossierId !== id),
        factures: s.factures.map((facture) =>
          facture.dossierId === id ? { ...facture, dossierId: null } : facture,
        ),
        dossierFournisseurs: updatedDossierFournisseurs,
        fournisseurs: syncFournisseurStats(updatedDossierFournisseurs, s.fournisseurs),
        devis: s.devis.map((devisItem) =>
          devisItem.dossierId === id ? { ...devisItem, dossierId: null } : devisItem,
        ),
        archives: s.archives.map((archive) =>
          archive.dossierId === id ? { ...archive, dossierId: undefined } : archive,
        ),
        documents: s.documents.map((document) =>
          document.dossierId === id ? { ...document, dossierId: undefined } : document,
        ),
        operationsComptables: s.operationsComptables.map((operation) =>
          operation.dossierId === id ? { ...operation, dossierId: undefined } : operation,
        ),
      };
    });

    if (!dossier) return;

    const orphanBons = get().bons.filter((bon) => bon.marchandise.includes(dossier.reference));
    const orphanNote =
      orphanBons.length > 0 ? ` — ${orphanBons.length} bon(s) potentiellement orphelin(s)` : "";
    await get().addAuditLog(
      AUDIT_MODULE.Dossiers,
      AUDIT_ACTION.Suppression,
      `Dossier ${dossier.reference} supprimé${orphanNote}`,
      dossier.clientId,
      { sourceType: "dossier", sourceId: dossier.id },
    );
  },

  getDossier: (id) => get().dossiers.find((dossier) => dossier.id === id),

  transitionDossier: async (id, newStatut, montantRecu, modePaiement, transitionNote, effectiveDate) => {
    const dossier = get().dossiers.find((item) => item.id === id);
    if (!dossier) return;

    assertDossierTransition(dossier.statut, newStatut);

    // Soldé avec reste dû exige un encaissement couvrant le solde — la garde UI
    // ne suffit pas (appel programmatique ou RPC).
    const reste = resteAPayer(dossier);
    if (newStatut === DOSSIER_STATUT_SOLDE && reste > 0) {
      if (!(typeof montantRecu === "number" && montantRecu >= reste)) {
        throw new Error(
          `Impossible de solder le dossier : le paiement doit couvrir le solde dû (${reste.toLocaleString("fr-FR")} FCFA).`,
        );
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    const resolvedDate = effectiveDate || today;
    const dateDedouanement =
      newStatut === DOSSIER_STATUT_DEDOUANE ? resolvedDate : dossier.dateDedouanement;

    let updatedMontantPaye = dossier.montantPaye;
    let ecriturePatch: Awaited<ReturnType<typeof syncEcritureWhenDossierSolde>> | undefined;

    if (shouldSyncEcritureOnDossierSolde(newStatut, montantRecu)) {
      // Solde + encaissement atomiques côté DB (verrou + cumul en Postgres) —
      // le statut est mis à "Soldé" par le RPC lui-même, pas de .update() séparé ici.
      ecriturePatch = await syncEcritureWhenDossierSolde(dossier, get().ecritures, get().ecritureSeq, {
        montantRecu,
        modePaiement,
        transitionNote,
        resolvedDate,
        today,
      });
      updatedMontantPaye = ecriturePatch.dossierMontantPaye;
    } else {
      try {
        await api.dossiers.updateStatut(id, newStatut);
      } catch (e) {
        logWarn("api.dossiers.updateStatut (mode local)", e);
      }
    }

    set((s) => ({
      dossiers: s.dossiers.map((item) =>
        item.id === id
          ? { ...item, statut: newStatut, montantPaye: updatedMontantPaye, dateDedouanement }
          : item,
      ),
      ecritures: ecriturePatch?.ecritures ?? s.ecritures,
      ecritureSeq: ecriturePatch?.ecritureSeq ?? s.ecritureSeq,
      clients: syncClientStats(
        s.dossiers.map((item) =>
          item.id === id
            ? { ...item, statut: newStatut, montantPaye: updatedMontantPaye, dateDedouanement }
            : item,
        ),
        s.factures,
        ecriturePatch?.ecritures ?? s.ecritures,
        s.clients,
      ),
    }));

    await get().addAuditLog(
      AUDIT_MODULE.Dossiers,
      AUDIT_ACTION.Validation,
      `Dossier ${dossier.reference} → ${newStatut}${montantRecu ? ` — ${montantRecu.toLocaleString("fr-FR")} FCFA reçus` : ""}`,
      dossier.clientId,
      { sourceType: "dossier", sourceId: id },
    );
  },
});

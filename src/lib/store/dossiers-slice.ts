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
import type { DossierRow } from "@/lib/db-rows";
import {
  shouldSyncEcritureOnDossierSolde,
  syncEcritureWhenDossierSolde,
} from "@/lib/store/sync-helpers";
import {
  computeDossierReference,
  computeHistoricalDossierReference,
  extractTrailingSeq,
  insertWithReferenceRetry,
} from "@/lib/store/reference";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

export function mapDossierFromDb(row: DossierRow): Dossier {
  return {
    id: row.id,
    reference: row.reference,
    annexeId: row.annexe_id,
    annexeNom: row.annexes?.nom,
    clientId: row.client_id,
    clientNom: row.clients?.nom || "—",
    bl: row.bl,
    camion: row.camion,
    nature: row.nature,
    droitDouane: Number(row.droit_douane),
    fraisCircuit: Number(row.frais_circuit),
    fraisPrestation: Number(row.frais_prestation),
    montantInvesti: Number(row.montant_investi),
    montantPaye: Number(row.montant_paye),
    statut: row.statut,
    date: row.date,
    dateEcheance: row.date_echeance ?? undefined,
    dateDedouanement: row.date_dedouanement ?? undefined,
    modeTransport: row.mode_transport ?? undefined,
    noConteneur: row.no_conteneur ?? undefined,
    portEntree: row.port_entree ?? undefined,
    poidsTotal: row.poids_total ? Number(row.poids_total) : undefined,
    notes: row.notes ?? undefined,
  };
}

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
    const { reference: initialReference, useAnnexeNumbering } = resolveDossierReference(
      get,
      input.annexeId,
      year,
    );
    const statut: DossierStatut = DOSSIER_STATUT_EN_COURS;

    const reference = initialReference;
    const newDossier: Dossier = {
      id: crypto.randomUUID(),
      reference,
      annexeId: input.annexeId,
      annexeNom: get().annexes.find((item) => item.id === input.annexeId)?.nom,
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
      });
      if (created?.id) {
        newDossier.id = created.id;
      }
    } catch (e) {
      console.warn("api.dossiers.create (mode local/déconnecté) :", e);
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

  /**
   * Backfill d'un dossier déjà connu (import Excel multi-clients) : contrairement
   * à addDossier, écrit montant_paye et statut directement — ce ne sont pas des
   * dossiers qui démarrent un flux métier, mais des opérations déjà closes ou
   * partiellement réglées dont on documente l'historique.
   */
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
      console.warn("api.dossiers.create historique (mode local) :", e);
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
    // Le statut ne se change que via transitionDossier (flux guidé) — jamais
    // via input.statut, qui n'est pas passé par assertDossierTransition
    // (pas de vérif reste-à-payer avant "Soldé", etc.). Sans dossier existant
    // en cache local, on ne peut pas savoir quel statut est réellement
    // persisté : on refuse plutôt que de faire confiance à une valeur
    // non validée.
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
      });
    } catch (e) {
      console.warn("api.dossiers.update (mode local) :", e);
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
      console.warn("api.dossiers.delete (mode local) :", e);
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
        console.warn("api.dossiers.updateStatut (mode local) :", e);
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

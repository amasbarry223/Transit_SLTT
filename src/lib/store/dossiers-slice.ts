import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
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
    societeId: row.societe_id,
    societeNom: row.societes?.nom || "—",
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

/** Génère la prochaine référence dossier (numérotation par annexe si société transit, sinon globale). */
function resolveDossierReference(
  get: () => SLTTState,
  societeId: string,
  annexeId: string,
  year: number,
): { reference: string; useAnnexeNumbering: boolean; seq: number } {
  const societe = get().societes.find((item) => item.id === societeId);
  const annexe = get().annexes.find((item) => item.id === annexeId);
  const prefix = societe?.nom?.trim() || resolveDossierReferencePrefix(get().societes);
  return computeDossierReference(
    societe,
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
      input.societeId,
      input.annexeId,
      year,
    );
    const statut: DossierStatut = DOSSIER_STATUT_EN_COURS;

    // Retry avec référence incrémentée si deux créations concurrentes ont
    // calculé le même numéro à partir d'un même snapshot client — la
    // contrainte unique en base fait alors échouer l'un des deux inserts.
    const { data, reference } = await insertWithReferenceRetry<DossierRow>(initialReference, (ref) =>
      supabase
        .from("dossiers")
        .insert({
          reference: ref,
          societe_id: input.societeId,
          annexe_id: input.annexeId,
          client_id: input.clientId,
          bl: input.bl,
          camion: input.camion,
          nature: input.nature,
          droit_douane: input.droitDouane,
          frais_circuit: input.fraisCircuit,
          frais_prestation: input.fraisPrestation,
          montant_investi: input.montantInvesti,
          montant_paye: 0,
          statut,
          date: input.date,
          date_echeance: input.dateEcheance,
          date_dedouanement: input.dateDedouanement,
          mode_transport: input.modeTransport,
          no_conteneur: input.noConteneur,
          port_entree: input.portEntree,
          poids_total: input.poidsTotal,
          notes: input.notes,
        })
        .select("*, clients(nom), societes(nom), annexes(nom)")
        .single(),
    );

    const newDossier = mapDossierFromDb(data);
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
    const societe = get().societes.find((item) => item.id === input.societeId);
    const annexe = get().annexes.find((item) => item.id === input.annexeId);
    const prefix = societe?.nom?.trim() || resolveDossierReferencePrefix(get().societes);
    const { reference } = computeHistoricalDossierReference(
      societe,
      annexe,
      prefix,
      get().dossiers.map((dossier) => dossier.reference),
      year,
    );

    const { data, error } = await supabase
      .from("dossiers")
      .insert({
        reference,
        societe_id: input.societeId,
        annexe_id: input.annexeId,
        client_id: input.clientId,
        bl: "",
        camion: "",
        nature: input.nature,
        droit_douane: 0,
        frais_circuit: 0,
        frais_prestation: input.montantInvesti,
        montant_investi: input.montantInvesti,
        montant_paye: input.montantPaye,
        statut: input.statut,
        date: input.date,
        notes: input.notes,
      })
      .select("*, clients(nom), societes(nom), annexes(nom)")
      .single();

    if (error) throw error;
    const newDossier = mapDossierFromDb(data);
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
    // Le statut ne se change que via transitionDossier (flux guidé).
    const statut = existing?.statut ?? input.statut;
    const societeNom =
      get().societes.find((item) => item.id === input.societeId)?.nom ||
      existing?.societeNom ||
      "—";
    const annexeNom =
      get().annexes.find((item) => item.id === input.annexeId)?.nom ||
      existing?.annexeNom;

    const { error } = await supabase
      .from("dossiers")
      .update({
        societe_id: input.societeId,
        annexe_id: input.annexeId,
        client_id: input.clientId,
        bl: input.bl,
        camion: input.camion,
        nature: input.nature,
        droit_douane: input.droitDouane,
        frais_circuit: input.fraisCircuit,
        frais_prestation: input.fraisPrestation,
        montant_investi: input.montantInvesti,
        statut,
        date: input.date,
        date_echeance: input.dateEcheance,
        date_dedouanement: input.dateDedouanement,
        mode_transport: input.modeTransport,
        no_conteneur: input.noConteneur,
        port_entree: input.portEntree,
        poids_total: input.poidsTotal,
        notes: input.notes,
      })
      .eq("id", id);
    if (error) throw error;

    set((s) => {
      const updatedDossiers = s.dossiers.map((dossier) =>
        dossier.id === id
          ? { ...dossier, ...input, statut, societeId: input.societeId, societeNom, annexeId: input.annexeId, annexeNom }
          : dossier,
      );
      return {
        dossiers: updatedDossiers,
        clients: syncClientStats(updatedDossiers, s.factures, s.ecritures, s.clients),
      };
    });

    if (existing) {
      await get().addAuditLog(
        AUDIT_MODULE.Dossiers,
        AUDIT_ACTION.Modification,
        `Dossier ${existing.reference} modifié`,
        existing.clientId,
        { sourceType: "dossier", sourceId: id },
      );
    }
  },

  removeDossier: async (id) => {
    const dossier = get().dossiers.find((item) => item.id === id);

    const { error } = await supabase.from("dossiers").delete().eq("id", id);
    if (error) throw error;

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
        // documents.dossier_id et operations_comptables.dossier_id sont
        // ON DELETE SET NULL en base (comme ecritures/factures/devis/archives
        // ci-dessus) — sans ça, ces deux tableaux restaient périmés en mémoire
        // (toujours liés au dossier supprimé) jusqu'au prochain refetch complet.
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
      const { error } = await supabase
        .from("dossiers")
        .update({
          statut: newStatut,
          ...(newStatut === DOSSIER_STATUT_DEDOUANE ? { date_dedouanement: resolvedDate } : {}),
        })
        .eq("id", id);
      if (error) throw error;
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

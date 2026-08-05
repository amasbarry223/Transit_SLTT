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
import { computeDossierReference } from "@/lib/store/reference";

export function mapDossierFromDb(x: DossierRow): Dossier {
  return {
    id: x.id,
    reference: x.reference,
    societeId: x.societe_id,
    societeNom: x.societes?.nom || "—",
    annexeId: x.annexe_id,
    annexeNom: x.annexes?.nom,
    clientId: x.client_id,
    clientNom: x.clients?.nom || "—",
    bl: x.bl,
    camion: x.camion,
    nature: x.nature,
    droitDouane: Number(x.droit_douane),
    fraisCircuit: Number(x.frais_circuit),
    fraisPrestation: Number(x.frais_prestation),
    montantInvesti: Number(x.montant_investi),
    montantPaye: Number(x.montant_paye),
    statut: x.statut,
    date: x.date,
    dateEcheance: x.date_echeance ?? undefined,
    dateDedouanement: x.date_dedouanement ?? undefined,
    modeTransport: x.mode_transport ?? undefined,
    noConteneur: x.no_conteneur ?? undefined,
    portEntree: x.port_entree ?? undefined,
    poidsTotal: x.poids_total ? Number(x.poids_total) : undefined,
    notes: x.notes ?? undefined,
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
  const annexe = get().annexes.find((a) => a.id === annexeId);
  const prefix = societe?.nom?.trim() || resolveDossierReferencePrefix(get().societes);
  return computeDossierReference(
    societe,
    annexe,
    prefix,
    get().dossiers.map((d) => d.reference),
    get().dossierSeq,
    year,
  );
}

export const createDossiersSlice: StateCreator<SLTTState, [], [], DossiersSlice> = (set, get) => ({
  dossiers: [],

  addDossier: async (input) => {
    const year = new Date().getFullYear();
    const { reference, useAnnexeNumbering, seq } = resolveDossierReference(
      get,
      input.societeId,
      input.annexeId,
      year,
    );
    const statut: DossierStatut = DOSSIER_STATUT_EN_COURS;

    const { data, error } = await supabase
      .from("dossiers")
      .insert({
        reference,
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
      .single();

    if (error) throw error;
    const newDossier = mapDossierFromDb(data);
    set((s) => {
      const updatedDossiers = [newDossier, ...s.dossiers];
      return {
        dossiers: updatedDossiers,
        dossierSeq: useAnnexeNumbering ? s.dossierSeq : seq + 1,
        clients: syncClientStats(updatedDossiers, s.factures, s.ecritures, s.clients),
      };
    });
    await get().addAuditLog(
      "Dossiers",
      "Création",
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
    const { reference, useAnnexeNumbering, seq } = resolveDossierReference(
      get,
      input.societeId,
      input.annexeId,
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
        dossierSeq: useAnnexeNumbering ? s.dossierSeq : seq + 1,
        clients: syncClientStats(updatedDossiers, s.factures, s.ecritures, s.clients),
      };
    });
    await get().addAuditLog(
      "Dossiers",
      "Création",
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
    const existing = get().dossiers.find((d) => d.id === id);
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
      const updatedDossiers = s.dossiers.map((d) =>
        d.id === id
          ? { ...d, ...input, statut, societeId: input.societeId, societeNom, annexeId: input.annexeId, annexeNom }
          : d,
      );
      return {
        dossiers: updatedDossiers,
        clients: syncClientStats(updatedDossiers, s.factures, s.ecritures, s.clients),
      };
    });

    if (existing) {
      await get().addAuditLog(
        "Dossiers",
        "Modification",
        `Dossier ${existing.reference} modifié`,
        existing.clientId,
        { sourceType: "dossier", sourceId: id },
      );
    }
  },

  removeDossier: async (id) => {
    const dossier = get().dossiers.find((d) => d.id === id);

    const { error } = await supabase.from("dossiers").delete().eq("id", id);
    if (error) throw error;

    set((s) => {
      const updatedDossiers = s.dossiers.filter((d) => d.id !== id);
      const updatedDossierFournisseurs = s.dossierFournisseurs.filter((df) => df.dossierId !== id);
      return {
        dossiers: updatedDossiers,
        clients: syncClientStats(updatedDossiers, s.factures, s.ecritures, s.clients),
        ecritures: s.ecritures.map((e) => (e.dossierId === id ? { ...e, dossierId: undefined } : e)),
        fichiers: s.fichiers.filter((f) => f.dossierId !== id),
        subDossiers: s.subDossiers.filter((sd) => sd.dossierId !== id),
        factures: s.factures.map((f) => (f.dossierId === id ? { ...f, dossierId: null } : f)),
        dossierFournisseurs: updatedDossierFournisseurs,
        fournisseurs: syncFournisseurStats(updatedDossierFournisseurs, s.fournisseurs),
        devis: s.devis.map((d) => (d.dossierId === id ? { ...d, dossierId: null } : d)),
        archives: s.archives.map((a) => (a.dossierId === id ? { ...a, dossierId: undefined } : a)),
      };
    });

    if (!dossier) return;

    const orphanBons = get().bons.filter((b) => b.marchandise.includes(dossier.reference));
    const orphanNote =
      orphanBons.length > 0 ? ` — ${orphanBons.length} bon(s) potentiellement orphelin(s)` : "";
    await get().addAuditLog(
      "Dossiers",
      "Suppression",
      `Dossier ${dossier.reference} supprimé${orphanNote}`,
      dossier.clientId,
      { sourceType: "dossier", sourceId: dossier.id },
    );
  },

  getDossier: (id) => get().dossiers.find((d) => d.id === id),

  transitionDossier: async (id, newStatut, montantRecu, modePaiement, transitionNote, effectiveDate) => {
    const dossier = get().dossiers.find((d) => d.id === id);
    if (!dossier) return;

    assertDossierTransition(dossier.statut, newStatut);

    // Soldé avec reste dû exige un encaissement — la garde UI ne suffit pas.
    if (newStatut === DOSSIER_STATUT_SOLDE && resteAPayer(dossier) > 0) {
      if (!(typeof montantRecu === "number" && montantRecu > 0)) {
        throw new Error(
          "Impossible de solder le dossier sans encaissement : un montant reçu est requis tant qu'il reste dû.",
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
      dossiers: s.dossiers.map((d) =>
        d.id === id ? { ...d, statut: newStatut, montantPaye: updatedMontantPaye, dateDedouanement } : d,
      ),
      ecritures: ecriturePatch?.ecritures ?? s.ecritures,
      ecritureSeq: ecriturePatch?.ecritureSeq ?? s.ecritureSeq,
      clients: syncClientStats(
        s.dossiers.map((d) =>
          d.id === id
            ? { ...d, statut: newStatut, montantPaye: updatedMontantPaye, dateDedouanement }
            : d,
        ),
        s.factures,
        ecriturePatch?.ecritures ?? s.ecritures,
        s.clients,
      ),
    }));

    await get().addAuditLog(
      "Dossiers",
      "Validation",
      `Dossier ${dossier.reference} → ${newStatut}${montantRecu ? ` — ${montantRecu.toLocaleString("fr-FR")} FCFA reçus` : ""}`,
      dossier.clientId,
      { sourceType: "dossier", sourceId: id },
    );
  },
});

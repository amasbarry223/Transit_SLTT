import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import { syncClientStats } from "@/lib/client-stats";
import { assertDossierTransition } from "@/lib/dossier-flow";
import {
  DOSSIER_REFERENCE_PAD_LENGTH,
  DOSSIER_STATUT_DEDOUANE,
  DOSSIER_STATUT_EN_COURS,
  DOSSIER_STATUT_SOLDE,
} from "@/lib/constants";
import type { Dossier, DossierStatut, Fournisseur, PaiementMode } from "@/lib/domain-types";
import type { DossierInput, SLTTState } from "@/lib/store";
import {
  shouldSyncEcritureOnDossierSolde,
  syncEcritureWhenDossierSolde,
} from "@/lib/store/sync-helpers";

function pad(n: number, len: number): string {
  return String(n).padStart(len, "0");
}

export function mapDossierFromDb(x: any): Dossier {
  return {
    id: x.id,
    reference: x.reference,
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
    dateEcheance: x.date_echeance,
    dateDedouanement: x.date_dedouanement,
    modeTransport: x.mode_transport,
    noConteneur: x.no_conteneur,
    portEntree: x.port_entree,
    poidsTotal: x.poids_total ? Number(x.poids_total) : undefined,
    notes: x.notes,
  };
}

function syncFournisseurStats(
  df: SLTTState["dossierFournisseurs"],
  providers: Fournisseur[],
): Fournisseur[] {
  return providers.map((f) => {
    const related = df.filter((d) => d.fournisseurId === f.id);
    return {
      ...f,
      nbDossiers: related.length,
      montantTotal: related.reduce((sum, d) => sum + d.montantReel, 0),
    };
  });
}

export interface DossiersSlice {
  dossiers: Dossier[];
  addDossier: (input: DossierInput) => Promise<Dossier>;
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

export const createDossiersSlice: StateCreator<SLTTState, [], [], DossiersSlice> = (set, get) => ({
  dossiers: [],

  addDossier: async (input) => {
    const seq = get().dossierSeq;
    const year = new Date().getFullYear();
    const reference = `SLTT-TR-${year}-${pad(seq, DOSSIER_REFERENCE_PAD_LENGTH)}`;
    const statut: DossierStatut = DOSSIER_STATUT_EN_COURS;

    const { data, error } = await supabase
      .from("dossiers")
      .insert({
        reference,
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
      .select("*, clients(nom)")
      .single();

    if (error) throw error;
    const newDossier = mapDossierFromDb(data);
    set((s) => {
      const updatedDossiers = [newDossier, ...s.dossiers];
      return {
        dossiers: updatedDossiers,
        dossierSeq: seq + 1,
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

  updateDossier: async (id, input) => {
    const existing = get().dossiers.find((d) => d.id === id);
    // Le statut ne se change que via transitionDossier (flux guidé).
    const statut = existing?.statut ?? input.statut;

    const { error } = await supabase
      .from("dossiers")
      .update({
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
      const updatedDossiers = s.dossiers.map((d) => (d.id === id ? { ...d, ...input, statut } : d));
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

    const montantApplicable = newStatut === DOSSIER_STATUT_SOLDE ? montantRecu : undefined;
    const updatedMontantPaye =
      montantApplicable !== undefined
        ? Math.min(dossier.montantInvesti, Math.max(0, dossier.montantPaye + montantApplicable))
        : dossier.montantPaye;
    const today = new Date().toISOString().slice(0, 10);
    const resolvedDate = effectiveDate || today;
    const dateDedouanement =
      newStatut === DOSSIER_STATUT_DEDOUANE ? resolvedDate : dossier.dateDedouanement;

    const { error } = await supabase
      .from("dossiers")
      .update({
        statut: newStatut,
        montant_paye: updatedMontantPaye,
        ...(newStatut === DOSSIER_STATUT_DEDOUANE ? { date_dedouanement: resolvedDate } : {}),
      })
      .eq("id", id);
    if (error) throw error;

    let ecriturePatch: Awaited<ReturnType<typeof syncEcritureWhenDossierSolde>> | undefined;
    if (shouldSyncEcritureOnDossierSolde(newStatut, montantRecu)) {
      ecriturePatch = await syncEcritureWhenDossierSolde(dossier, get().ecritures, get().ecritureSeq, {
        montantPaye: updatedMontantPaye,
        modePaiement,
        transitionNote,
        resolvedDate,
        today,
      });
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

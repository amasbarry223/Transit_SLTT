import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import { syncClientStats } from "@/lib/client-stats";
import { validatePaymentAmount } from "@/lib/payments";
import { canTransitionFacture } from "@/lib/status-flow";
import { getConnectedUserName } from "@/lib/store/connected-user";
import type { Facture, FactureLigne, FactureStatut } from "@/lib/domain-types";
import { resteAPayer } from "@/lib/domain-types";
import type { FactureInput, SLTTState } from "@/lib/store";
import type { FactureRow } from "@/lib/db-rows";
import { nextAnnexeYearlyReference, nextScopedSeq, nextYearlyReference } from "@/lib/store/reference";

export function mapFactureFromDb(x: FactureRow): Facture {
  return {
    id: x.id,
    numero: x.numero,
    dossierId: x.dossier_id,
    clientId: x.client_id,
    clientNom: x.clients?.nom || "—",
    societeId: x.societe_id || undefined,
    societeNom: x.societes?.nom || undefined,
    annexeId: x.annexe_id,
    annexeNom: x.annexes?.nom,
    date: x.date,
    dateEcheance: x.date_echeance,
    statut: x.statut,
    tauxTVA: Number(x.taux_tva),
    montantHT: Number(x.montant_ht),
    montantTVA: Number(x.montant_tva),
    montantTTC: Number(x.montant_ttc),
    montantPaye: Number(x.montant_paye),
    notes: x.notes,
    creePar: x.cree_par,
    creeLe: x.cree_le ?? x.created_at,
    lignes: (x.facture_lignes || []).map((l) => ({
      id: l.id,
      description: l.description,
      quantite: Number(l.quantite),
      prixUnitaire: Number(l.prix_unitaire),
      montantHT: Number(l.montant_ht),
      compagnie: l.compagnie || undefined,
      bordereauLivraison: l.bordereau_livraison || undefined,
    })),
  };
}

export interface FacturesSlice {
  factures: Facture[];
  factureSeq: number;
  addFacture: (input: FactureInput) => Promise<Facture>;
  updateFacture: (id: string, input: FactureInput) => Promise<void>;
  removeFacture: (id: string) => Promise<void>;
  updateFactureStatut: (id: string, statut: FactureStatut) => Promise<void>;
  recordFacturePaiement: (id: string, montant: number) => Promise<void>;
  patchFactureMontantPaye: (id: string, montantPaye: number) => Promise<void>;
}

export const createFacturesSlice: StateCreator<SLTTState, [], [], FacturesSlice> = (set, get) => ({
  factures: [],
  factureSeq: 1,

  addFacture: async (input) => {
    const societe = input.societeId ? get().societes.find((s) => s.id === input.societeId) : undefined;
    const annexe = get().annexes.find((a) => a.id === input.annexeId);
    const useAnnexeNumbering = Boolean(societe?.isTransit && annexe?.code);

    const seq = useAnnexeNumbering
      ? nextScopedSeq(get().factures.map((f) => f.numero), (r) => r.startsWith(`${annexe!.code}-FACT-`))
      : get().factureSeq;
    const numero = useAnnexeNumbering
      ? nextAnnexeYearlyReference(annexe!.code, "FACT", seq)
      : nextYearlyReference("FACT", seq);

    const HT = input.lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0);
    const TVA = Math.round(HT * (input.tauxTVA / 100));
    const TTC = HT + TVA;
    const creePar = getConnectedUserName();

    const { data: dbFact, error: errFact } = await supabase
      .from("factures")
      .insert({
        numero,
        dossier_id: input.dossierId,
        client_id: input.clientId,
        societe_id: input.societeId || null,
        annexe_id: input.annexeId,
        date: input.date,
        date_echeance: input.dateEcheance,
        statut: "Brouillon",
        taux_tva: input.tauxTVA,
        montant_ht: HT,
        montant_tva: TVA,
        montant_ttc: TTC,
        montant_paye: 0,
        notes: input.notes,
        cree_par: creePar,
      })
      .select()
      .single();

    if (errFact) throw errFact;

    if (input.lignes.length > 0) {
      const { error: errLignes } = await supabase
        .from("facture_lignes")
        .insert(
          input.lignes.map((l) => ({
            facture_id: dbFact.id,
            description: l.description,
            quantite: l.quantite,
            prix_unitaire: l.prixUnitaire,
            montant_ht: l.quantite * l.prixUnitaire,
            compagnie: l.compagnie || null,
            bordereau_livraison: l.bordereauLivraison || null,
          })),
        );
      if (errLignes) throw errLignes;
    }

    const { data: fullFact, error: errFetch } = await supabase
      .from("factures")
      .select("*, facture_lignes(*), clients(nom), societes(nom), annexes(nom)")
      .eq("id", dbFact.id)
      .single();

    if (errFetch) throw errFetch;

    const newFacture = mapFactureFromDb(fullFact);
    set((s) => {
      const updatedFactures = [newFacture, ...s.factures];
      return {
        factures: updatedFactures,
        factureSeq: useAnnexeNumbering ? s.factureSeq : seq + 1,
        clients: syncClientStats(s.dossiers, updatedFactures, s.ecritures, s.clients),
      };
    });
    await get().addAuditLog(
      "Factures",
      "Création",
      `Facture ${numero} créée`,
      newFacture.clientId,
      { sourceType: "facture", sourceId: newFacture.id },
    );
    return newFacture;
  },

  updateFacture: async (id, input) => {
    const existing = get().factures.find((f) => f.id === id);
    const HT = input.lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0);
    const TVA = Math.round(HT * (input.tauxTVA / 100));
    const TTC = HT + TVA;

    const { error: errFact } = await supabase
      .from("factures")
      .update({
        dossier_id: input.dossierId,
        client_id: input.clientId,
        societe_id: input.societeId ?? null,
        annexe_id: input.annexeId,
        date: input.date,
        date_echeance: input.dateEcheance,
        taux_tva: input.tauxTVA,
        montant_ht: HT,
        montant_tva: TVA,
        montant_ttc: TTC,
        notes: input.notes,
      })
      .eq("id", id);

    if (errFact) throw errFact;

    const lignesPayload = input.lignes.map((l) => ({
      description: l.description,
      quantite: l.quantite,
      prix_unitaire: l.prixUnitaire,
      montant_ht: l.quantite * l.prixUnitaire,
      compagnie: l.compagnie || null,
      bordereau_livraison: l.bordereauLivraison || null,
    }));
    const { error: errLignes } = await supabase.rpc("replace_facture_lignes", {
      p_facture_id: id,
      p_lignes: lignesPayload,
    });
    if (errLignes) throw errLignes;

    set((s) => {
      const updatedFactures = s.factures.map((fact) => {
        if (fact.id !== id) return fact;
        const updatedLignes: FactureLigne[] = input.lignes.map((l, idx) => ({
          id: `FL-${idx + 1}`,
          description: l.description,
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
          montantHT: l.quantite * l.prixUnitaire,
          compagnie: l.compagnie,
          bordereauLivraison: l.bordereauLivraison,
        }));
        return {
          ...fact,
          ...input,
          societeId: input.societeId ?? undefined,
          annexeId: input.annexeId,
          montantHT: HT,
          montantTVA: TVA,
          montantTTC: TTC,
          lignes: updatedLignes,
        };
      });
      return {
        factures: updatedFactures,
        clients: syncClientStats(s.dossiers, updatedFactures, s.ecritures, s.clients),
      };
    });
    if (existing) {
      await get().addAuditLog(
        "Factures",
        "Modification",
        `Facture ${existing.numero} modifiée`,
        input.clientId,
        { sourceType: "facture", sourceId: id },
      );
    }
  },

  removeFacture: async (id) => {
    const fact = get().factures.find((f) => f.id === id);

    const { error } = await supabase.from("factures").delete().eq("id", id);
    if (error) throw error;

    set((s) => {
      const updatedFactures = s.factures.filter((f) => f.id !== id);
      return {
        factures: updatedFactures,
        clients: syncClientStats(s.dossiers, updatedFactures, s.ecritures, s.clients),
      };
    });

    if (fact) {
      await get().addAuditLog(
        "Factures",
        "Suppression",
        `Facture ${fact.numero} supprimée`,
        fact.clientId,
        { sourceType: "facture", sourceId: fact.id },
      );
    }
  },

  updateFactureStatut: async (id, statut) => {
    const f = get().factures.find((x) => x.id === id);
    if (!f) return;
    if (!canTransitionFacture(f.statut, statut)) {
      throw new Error(`Transition non autorisée : ${f.statut} → ${statut}.`);
    }
    // Soldée ne peut résulter que d'un encaissement (RPC record_facture_paiement)
    // — jamais d'un PATCH statut qui force montant_paye = TTC hors journal.
    if (statut === "Soldée") {
      throw new Error(
        "Pour solder une facture, enregistrez un paiement (encaissement) couvrant le reste dû.",
      );
    }

    const { error } = await supabase
      .from("factures")
      .update({ statut })
      .eq("id", id);
    if (error) throw error;

    set((s) => {
      const updatedFactures = s.factures.map((x) =>
        x.id === id ? { ...x, statut } : x,
      );
      return {
        factures: updatedFactures,
        clients: syncClientStats(s.dossiers, updatedFactures, s.ecritures, s.clients),
      };
    });

    await get().addAuditLog(
      "Factures",
      "Modification",
      `Facture ${f.numero} → ${statut}`,
      f.clientId,
      { sourceType: "facture", sourceId: id },
    );
  },

  recordFacturePaiement: async (id, montant) => {
    const fact = get().factures.find((f) => f.id === id);
    if (!fact) return;
    if (fact.statut === "Brouillon" || fact.statut === "Annulée" || fact.statut === "Soldée") {
      throw new Error(`Impossible d'enregistrer un paiement sur une facture ${fact.statut}.`);
    }

    const reste = resteAPayer({ montantInvesti: fact.montantTTC, montantPaye: fact.montantPaye });
    const effective = validatePaymentAmount(montant, reste);

    const { data, error } = await supabase.rpc("record_facture_paiement", {
      p_facture_id: id,
      p_montant: effective,
    });
    if (error) throw error;
    const row = data as { montant_paye: number; statut: FactureStatut };
    const newPaye = Number(row.montant_paye);
    const newStatut = row.statut;

    set((s) => {
      const updatedFactures = s.factures.map((f) =>
        f.id === id ? { ...f, montantPaye: newPaye, statut: newStatut } : f,
      );
      return {
        factures: updatedFactures,
        clients: syncClientStats(s.dossiers, updatedFactures, s.ecritures, s.clients),
      };
    });

    await get().addAuditLog(
      "Factures",
      "Paiement",
      `Encaissement de ${effective.toLocaleString("fr-FR")} FCFA sur la facture ${fact.numero}`,
      fact.clientId,
      { sourceType: "facture", sourceId: fact.id },
    );
  },

  patchFactureMontantPaye: async (id, montantPaye) => {
    const fact = get().factures.find((f) => f.id === id);
    if (!fact) throw new Error("Facture introuvable");
    if (fact.statut === "Annulée" || fact.statut === "Brouillon" || fact.statut === "Soldée") {
      throw new Error(`Impossible de modifier le paiement d'une facture ${fact.statut}.`);
    }

    // RPC atomique (verrou ligne en DB) : évite d'écraser un encaissement concurrent
    // enregistré au même moment via recordFacturePaiement.
    const { data, error } = await supabase.rpc("patch_facture_montant_paye", {
      p_facture_id: id,
      p_montant_paye: montantPaye,
    });
    if (error) throw error;
    const row = data as { montant_paye: number; statut: FactureStatut };
    const paye = Number(row.montant_paye);
    const newStatut = row.statut;

    set((s) => {
      const updatedFactures = s.factures.map((f) =>
        f.id === id ? { ...f, montantPaye: paye, statut: newStatut } : f,
      );
      return {
        factures: updatedFactures,
        clients: syncClientStats(s.dossiers, updatedFactures, s.ecritures, s.clients),
      };
    });

    await get().addAuditLog(
      "Factures",
      "Modification",
      `Paiement facture ${fact.numero} ajusté (classeur) → ${paye.toLocaleString("fr-FR")} FCFA`,
      fact.clientId,
      { sourceType: "facture", sourceId: id },
    );
  },
});

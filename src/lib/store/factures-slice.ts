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
import {
  computeAnnexeScopedReference,
  extractTrailingSeq,
  insertWithReferenceRetry,
} from "@/lib/store/reference";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

export function mapFactureFromDb(row: FactureRow): Facture {
  return {
    id: row.id,
    numero: row.numero,
    dossierId: row.dossier_id,
    clientId: row.client_id,
    clientNom: row.clients?.nom || "—",
    societeId: row.societe_id || undefined,
    societeNom: row.societes?.nom || undefined,
    annexeId: row.annexe_id,
    annexeNom: row.annexes?.nom,
    date: row.date,
    dateEcheance: row.date_echeance,
    statut: row.statut,
    tauxTVA: Number(row.taux_tva),
    montantHT: Number(row.montant_ht),
    montantTVA: Number(row.montant_tva),
    montantTTC: Number(row.montant_ttc),
    montantPaye: Number(row.montant_paye),
    notes: row.notes,
    creePar: row.cree_par,
    creeLe: row.cree_le ?? row.created_at,
    lignes: (row.facture_lignes || []).map((ligne) => ({
      id: ligne.id,
      description: ligne.description,
      quantite: Number(ligne.quantite),
      prixUnitaire: Number(ligne.prix_unitaire),
      montantHT: Number(ligne.montant_ht),
      compagnie: ligne.compagnie || undefined,
      bordereauLivraison: ligne.bordereau_livraison || undefined,
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

function computeInvoiceAmounts(
  lignes: { quantite: number; prixUnitaire: number }[],
  vatRate: number,
) {
  const amountExclTax = lignes.reduce((sum, line) => sum + line.quantite * line.prixUnitaire, 0);
  const vatAmount = Math.round(amountExclTax * (vatRate / 100));
  const amountInclTax = amountExclTax + vatAmount;
  return { amountExclTax, vatAmount, amountInclTax };
}

export const createFacturesSlice: StateCreator<SLTTState, [], [], FacturesSlice> = (set, get) => ({
  factures: [],
  factureSeq: 1,

  addFacture: async (input) => {
    const societe = input.societeId ? get().societes.find((s) => s.id === input.societeId) : undefined;
    const annexe = get().annexes.find((a) => a.id === input.annexeId);
    const { reference: initialNumero, useAnnexeNumbering } = computeAnnexeScopedReference(
      societe,
      annexe,
      "FACT",
      get().factures.map((f) => f.numero),
      get().factureSeq,
    );

    const { amountExclTax, vatAmount, amountInclTax } = computeInvoiceAmounts(
      input.lignes,
      input.tauxTVA,
    );
    const creePar = getConnectedUserName();

    // Retry avec numéro incrémenté si deux créations concurrentes ont calculé
    // le même numéro à partir d'un même snapshot client (contrainte unique en base).
    const { data: dbFact, reference: numero } = await insertWithReferenceRetry<{ id: string }>(initialNumero, (ref) =>
      supabase
        .from("factures")
        .insert({
          numero: ref,
          dossier_id: input.dossierId,
          client_id: input.clientId,
          societe_id: input.societeId || null,
          annexe_id: input.annexeId,
          date: input.date,
          date_echeance: input.dateEcheance,
          statut: "Brouillon",
          taux_tva: input.tauxTVA,
          montant_ht: amountExclTax,
          montant_tva: vatAmount,
          montant_ttc: amountInclTax,
          montant_paye: 0,
          notes: input.notes,
          cree_par: creePar,
        })
        .select()
        .single(),
    );

    if (input.lignes.length > 0) {
      const { error: errLignes } = await supabase
        .from("facture_lignes")
        .insert(
          input.lignes.map((ligne) => ({
            facture_id: dbFact.id,
            description: ligne.description,
            quantite: ligne.quantite,
            prix_unitaire: ligne.prixUnitaire,
            montant_ht: ligne.quantite * ligne.prixUnitaire,
            compagnie: ligne.compagnie || null,
            bordereau_livraison: ligne.bordereauLivraison || null,
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
    const finalSeq = extractTrailingSeq(numero) ?? get().factureSeq;
    set((s) => {
      const updatedFactures = [newFacture, ...s.factures];
      return {
        factures: updatedFactures,
        factureSeq: useAnnexeNumbering ? s.factureSeq : finalSeq + 1,
        clients: syncClientStats(s.dossiers, updatedFactures, s.ecritures, s.clients),
      };
    });
    await get().addAuditLog(
      AUDIT_MODULE.Factures,
      AUDIT_ACTION.Creation,
      `Facture ${numero} créée`,
      newFacture.clientId,
      { sourceType: "facture", sourceId: newFacture.id },
    );
    return newFacture;
  },

  updateFacture: async (id, input) => {
    const existing = get().factures.find((f) => f.id === id);
    const { amountExclTax, vatAmount, amountInclTax } = computeInvoiceAmounts(
      input.lignes,
      input.tauxTVA,
    );

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
        montant_ht: amountExclTax,
        montant_tva: vatAmount,
        montant_ttc: amountInclTax,
        notes: input.notes,
      })
      .eq("id", id);

    if (errFact) throw errFact;

    const lignesPayload = input.lignes.map((ligne) => ({
      description: ligne.description,
      quantite: ligne.quantite,
      prix_unitaire: ligne.prixUnitaire,
      montant_ht: ligne.quantite * ligne.prixUnitaire,
      compagnie: ligne.compagnie || null,
      bordereau_livraison: ligne.bordereauLivraison || null,
    }));
    const { error: errLignes } = await supabase.rpc("replace_facture_lignes", {
      p_facture_id: id,
      p_lignes: lignesPayload,
    });
    if (errLignes) throw errLignes;

    set((s) => {
      const updatedFactures = s.factures.map((fact) => {
        if (fact.id !== id) return fact;
        const updatedLignes: FactureLigne[] = input.lignes.map((ligne, idx) => ({
          id: `FL-${idx + 1}`,
          description: ligne.description,
          quantite: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire,
          montantHT: ligne.quantite * ligne.prixUnitaire,
          compagnie: ligne.compagnie,
          bordereauLivraison: ligne.bordereauLivraison,
        }));
        return {
          ...fact,
          ...input,
          societeId: input.societeId ?? undefined,
          annexeId: input.annexeId,
          montantHT: amountExclTax,
          montantTVA: vatAmount,
          montantTTC: amountInclTax,
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
        AUDIT_MODULE.Factures,
        AUDIT_ACTION.Modification,
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
        AUDIT_MODULE.Factures,
        AUDIT_ACTION.Suppression,
        `Facture ${fact.numero} supprimée`,
        fact.clientId,
        { sourceType: "facture", sourceId: fact.id },
      );
    }
  },

  updateFactureStatut: async (id, statut) => {
    const facture = get().factures.find((item) => item.id === id);
    if (!facture) return;
    if (!canTransitionFacture(facture.statut, statut)) {
      throw new Error(`Transition non autorisée : ${facture.statut} → ${statut}.`);
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
      const updatedFactures = s.factures.map((item) =>
        item.id === id ? { ...item, statut } : item,
      );
      return {
        factures: updatedFactures,
        clients: syncClientStats(s.dossiers, updatedFactures, s.ecritures, s.clients),
      };
    });

    await get().addAuditLog(
      AUDIT_MODULE.Factures,
      AUDIT_ACTION.Modification,
      `Facture ${facture.numero} → ${statut}`,
      facture.clientId,
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
      AUDIT_MODULE.Factures,
      AUDIT_ACTION.Paiement,
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
      AUDIT_MODULE.Factures,
      AUDIT_ACTION.Modification,
      `Paiement facture ${fact.numero} ajusté (classeur) → ${paye.toLocaleString("fr-FR")} FCFA`,
      fact.clientId,
      { sourceType: "facture", sourceId: id },
    );
  },
});

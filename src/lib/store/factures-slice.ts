import { logWarn } from "@/shared/logger";
import type { StateCreator } from "zustand";
import { api } from "@/lib/api-client";
import { syncClientStats } from "@/lib/client-stats";
import { validatePaymentAmount } from "@/lib/payments";
import { canTransitionFacture } from "@/lib/status-flow";
import { getConnectedUserName } from "@/lib/store/connected-user";
import type { Facture, FactureLigne, FactureStatut } from "@/lib/domain-types";
import { resteAPayer } from "@/lib/domain-types";
import type { FactureInput, SLTTState } from "@/lib/store";
import {
  computeAnnexeScopedReference,
  extractTrailingSeq,
  insertWithReferenceRetry,
} from "@/lib/store/reference";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

export interface FacturesSlice {
  factures: Facture[];
  factureSeq: number;
  addFacture: (input: FactureInput) => Promise<Facture>;
  updateFacture: (id: string, input: FactureInput) => Promise<void>;
  removeFacture: (id: string) => Promise<void>;
  updateFactureStatut: (id: string, statut: FactureStatut) => Promise<void>;
  recordFacturePaiement: (id: string, montant: number) => Promise<void>;
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
    const annexe = get().annexes.find((a) => a.id === input.annexeId);
    const { reference: initialNumero, useAnnexeNumbering } = computeAnnexeScopedReference(
      undefined,
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

    const numero = initialNumero;
    const factId = crypto.randomUUID();
    const client = get().clients.find((c) => c.id === input.clientId);
    const newFacture: Facture = {
      id: factId,
      numero,
      dossierId: input.dossierId ?? null,
      clientId: input.clientId,
      clientNom: client?.nom || "—",
      annexeId: input.annexeId,
      annexeNom: annexe?.nom,
      date: input.date,
      dateEcheance: input.dateEcheance,
      statut: "Brouillon",
      tauxTVA: input.tauxTVA,
      montantHT: amountExclTax,
      montantTVA: vatAmount,
      montantTTC: amountInclTax,
      montantPaye: 0,
      notes: input.notes,
      creePar,
      creeLe: new Date().toISOString(),
      lignes: input.lignes.map((ligne, idx) => ({
        id: `FL-${idx + 1}`,
        description: ligne.description,
        quantite: ligne.quantite,
        prixUnitaire: ligne.prixUnitaire,
        montantHT: ligne.quantite * ligne.prixUnitaire,
        compagnie: ligne.compagnie,
        bordereauLivraison: ligne.bordereauLivraison,
      })),
    };

    try {
      const created = await api.factures.create({
        numero,
        annexeId: input.annexeId,
        clientId: input.clientId,
        dossierId: input.dossierId || undefined,
        dateEmission: input.date,
        dateEcheance: input.dateEcheance,
        tauxTva: input.tauxTVA,
        notes: input.notes,
        lignes: input.lignes.map((l) => ({
          designation: l.description,
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
        })),
      });
      if (created?.id) {
        newFacture.id = created.id;
      }
    } catch (e) {
      logWarn("api.factures.create (mode local)", e);
    }

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

    // Persistance obligatoire : une facture sans écriture serveur repartait à
    // zéro au rechargement. On propage l'erreur pour que l'UI la signale.
    await api.factures.update(id, {
      clientId: input.clientId,
      dossierId: input.dossierId || undefined,
      dateEmission: input.date,
      dateEcheance: input.dateEcheance,
      tauxTva: input.tauxTVA,
      notes: input.notes,
      lignes: input.lignes.map((l) => ({
        designation: l.description,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
      })),
    });

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

    await api.factures.delete(id);

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

    // L'encaissement crée une transaction de caisse côté serveur : il faut une
    // caisse de la MÊME annexe que la facture (avant, on prenait caisses[0]
    // — souvent inexistant — et le paiement n'était jamais persisté).
    const caissesResp = await api.caisse.getAll(fact.annexeId).catch(() => []);
    const caisses: Array<{ id?: string; annexeId?: string; statut?: string }> = Array.isArray(
      caissesResp,
    )
      ? caissesResp
      : [];
    const caisse =
      caisses.find((c) => c.annexeId === fact.annexeId && c.statut !== "FERMEE") ??
      caisses.find((c) => c.statut !== "FERMEE");
    if (!caisse?.id) {
      throw new Error(
        "Aucune caisse ouverte pour cette annexe. Ouvrez-en une avant d'encaisser une facture.",
      );
    }
    await api.factures.enregistrerPaiement(id, { montant: effective, caisseId: caisse.id });

    const newPaye = fact.montantPaye + effective;
    // Même tolérance d'arrondi que le backend (factures.service) pour ne pas
    // afficher "Partielle" alors que l'API a déjà passé la facture à PAYEE.
    const newStatut: FactureStatut = newPaye >= fact.montantTTC - 0.5 ? "Soldée" : "Partielle";
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
});

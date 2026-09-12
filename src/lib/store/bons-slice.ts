import type { StateCreator } from "zustand";
import { getConnectedUserName } from "@/lib/store/connected-user";
import type { BonLigne, BonSortie, BonSortieCaisse, BonSortieCaisseInput, Mouvement, StockItem } from "@/lib/domain-types";
import type { BonInput, SLTTState } from "@/lib/store";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

import {
  computeAnnexeScopedReference,
  extractTrailingSeq,
} from "@/lib/store/reference";

function findStockForBon(
  stock: StockItem[],
  ref: { stockId?: string; marchandise: string },
): StockItem | undefined {
  if (ref.stockId) return stock.find((s) => s.id === ref.stockId);
  return stock.find((s) => s.marchandise === ref.marchandise);
}

export interface BonsSlice {
  bons: BonSortie[];
  bonSeq: number;
  bonsSortieCaisse: BonSortieCaisse[];
  bonSortieCaisseSeq: number;
  addBon: (input: BonInput) => Promise<BonSortie>;
  validateBon: (id: string) => Promise<boolean>;
  addBonSortieCaisse: (input: BonSortieCaisseInput) => Promise<BonSortieCaisse>;
  updateBonSortieCaisse: (id: string, input: BonSortieCaisseInput) => Promise<void>;
  removeBonSortieCaisse: (id: string) => Promise<void>;
}

import { api } from "@/lib/api-client";

export const createBonsSlice: StateCreator<SLTTState, [], [], BonsSlice> = (set, get) => ({
  bons: [],
  bonSeq: 1,
  bonsSortieCaisse: [],
  bonSortieCaisseSeq: 1,

  addBon: async (input) => {
    const annexe = get().annexes.find((a) => a.id === input.annexeId);
    const { reference: initialNumero, useAnnexeNumbering } = computeAnnexeScopedReference(
      undefined,
      annexe,
      "BS",
      get().bons.map((b) => b.reference),
      get().bonSeq,
    );

    const numero = initialNumero;
    const client = get().clients.find((c) => c.id === input.clientId);

    const hasLignes = Boolean(input.lignes && input.lignes.length > 0);
    const lignes: BonLigne[] = hasLignes
      ? input.lignes!.map((l) => ({ ...l, id: crypto.randomUUID() }))
      : [];

    const totalQuantite = hasLignes ? lignes.reduce((acc, l) => acc + (Number(l.quantite) || 0), 0) : input.quantite;
    const totalMontant = hasLignes ? lignes.reduce((acc, l) => acc + (Number(l.montant) || 0), 0) : input.montant;
    const marchandise = hasLignes
      ? lignes.map((l) => l.marchandise).join(", ")
      : input.marchandise;
    const unite = hasLignes ? lignes[0]?.unite || input.unite : input.unite;
    const stockId = hasLignes ? lignes[0]?.stockId || input.stockId : input.stockId;

    // Persistance obligatoire : un bon sans écriture serveur disparaissait
    // silencieusement au rechargement (aucune erreur montrée, l'utilisateur
    // croyait le bon créé). On propage l'erreur pour que l'UI la signale,
    // et on n'ajoute rien au store local tant que le serveur n'a pas confirmé.
    const created = await api.bons.createBonSortie({
      reference: numero,
      date: input.date,
      clientId: input.clientId,
      clientNom: client?.nom || "",
      annexeId: input.annexeId,
      stockId,
      marchandise,
      quantite: totalQuantite,
      unite,
      motif: input.motif,
      montant: totalMontant,
      statut: input.statut || "Brouillon",
    });

    const newBon: BonSortie = {
      id: created?.id ?? crypto.randomUUID(),
      reference: numero,
      date: input.date,
      clientId: input.clientId,
      clientNom: client?.nom || "",
      annexeId: input.annexeId,
      annexeNom: annexe?.nom,
      stockId,
      marchandise,
      quantite: totalQuantite,
      unite,
      motif: input.motif,
      montant: totalMontant,
      statut: "Brouillon",
      lignes: hasLignes ? lignes : undefined,
    };

    const finalSeq = extractTrailingSeq(numero) ?? get().bonSeq;
    set((s) => ({
      bons: [newBon, ...s.bons],
      bonSeq: useAnnexeNumbering ? s.bonSeq : finalSeq + 1,
    }));
    await get().addAuditLog(AUDIT_MODULE.Bons, AUDIT_ACTION.Creation, `Bon ${numero} créé`);

    if (input.statut === "Validé") {
      const validated = await get().validateBon(newBon.id);
      if (!validated) {
        throw new Error("Stock insuffisant pour valider ce bon de sortie.");
      }
      return get().bons.find((b) => b.id === newBon.id) ?? newBon;
    }
    return newBon;
  },

  validateBon: async (id) => {
    const bon = get().bons.find((b) => b.id === id);
    if (!bon || bon.statut === "Validé") return false;

    // Si le bon comporte plusieurs lignes d'articles
    if (bon.lignes && bon.lignes.length > 0) {
      const neededByStockId = new Map<string, number>();
      for (const ligne of bon.lignes) {
        const stockItem = findStockForBon(get().stock, ligne);
        if (stockItem) {
          const current = neededByStockId.get(stockItem.id) || 0;
          neededByStockId.set(stockItem.id, current + ligne.quantite);
        }
      }

      for (const [stockId, neededQty] of neededByStockId.entries()) {
        const stockItem = get().stock.find((s) => s.id === stockId);
        if (stockItem && stockItem.quantite < neededQty) {
          return false;
        }
      }

      // Cet appel décrémente réellement le stock côté serveur : le laisser
      // échouer en silence marquerait le bon "Validé" localement sans que le
      // stock ait bougé en base — désynchronisation physique/logique, pas
      // seulement une perte d'enregistrement.
      await api.bons.validateBonSortie(id);

      let updatedStock = [...get().stock];
      const newMouvements: Mouvement[] = [];
      for (const ligne of bon.lignes) {
        const stockItem = findStockForBon(updatedStock, ligne);
        if (stockItem) {
          const newStockQty = Math.max(0, stockItem.quantite - ligne.quantite);
          updatedStock = updatedStock.map((item) =>
            item.id === stockItem.id ? { ...item, quantite: newStockQty } : item,
          );
          newMouvements.push({
            id: crypto.randomUUID(),
            annexeId: stockItem.annexeId || bon.annexeId,
            annexeNom: stockItem.annexeNom || bon.annexeNom,
            date: new Date().toISOString(),
            type: "Sortie" as const,
            marchandise: ligne.marchandise,
            quantite: ligne.quantite,
            unite: ligne.unite,
            responsable: getConnectedUserName(),
            bonRef: bon.reference,
          });
        }
      }

      set((s) => ({
        bons: s.bons.map((b) => (b.id === id ? { ...b, statut: "Validé" as const } : b)),
        stock: updatedStock,
        mouvements: [...newMouvements, ...s.mouvements],
      }));
      await get().addAuditLog(AUDIT_MODULE.Bons, AUDIT_ACTION.Validation, `Bon de sortie ${bon.reference} validé`);
      return true;
    }

    // Cas mono-article rétrocompatible
    const stockItem = findStockForBon(get().stock, bon);
    if (stockItem && stockItem.quantite < bon.quantite) {
      return false;
    }

    // Même raison que ci-dessus : ne pas laisser cet échec en silence.
    await api.bons.validateBonSortie(id);

    const newStockQty = stockItem ? stockItem.quantite - bon.quantite : 0;
    set((s) => ({
      bons: s.bons.map((b) => (b.id === id ? { ...b, statut: "Validé" as const } : b)),
      stock: stockItem
        ? s.stock.map((item) => (item.id === stockItem.id ? { ...item, quantite: newStockQty } : item))
        : s.stock,
      mouvements: [
        {
          id: crypto.randomUUID(),
          annexeId: stockItem?.annexeId || bon.annexeId,
          annexeNom: stockItem?.annexeNom || bon.annexeNom,
          date: new Date().toISOString(),
          type: "Sortie" as const,
          marchandise: bon.marchandise,
          quantite: bon.quantite,
          unite: bon.unite,
          responsable: getConnectedUserName(),
          bonRef: bon.reference,
        },
        ...s.mouvements,
      ],
    }));
    await get().addAuditLog(AUDIT_MODULE.Bons, AUDIT_ACTION.Validation, `Bon de sortie ${bon.reference} validé`);
    return true;
  },

  addBonSortieCaisse: async (input) => {
    const seq = get().bonSortieCaisseSeq;
    const initialReference = `N°${seq}`;
    const creePar = getConnectedUserName();
    const montantTotal = input.lignes.reduce((sum, ligne) => sum + ligne.montant, 0);

    const reference = initialReference;
    // Persistance obligatoire — voir addBon ci-dessus pour la justification.
    const created = await api.bons.createBonCaisse({
      reference,
      date: input.date,
      annexeId: input.annexeId,
      montantTotal,
      creePar,
      lignes: input.lignes,
    });

    const newBon: BonSortieCaisse = {
      id: created?.id ?? crypto.randomUUID(),
      reference,
      date: input.date,
      annexeId: input.annexeId,
      annexeNom: get().annexes.find((a) => a.id === input.annexeId)?.nom,
      montantTotal,
      creePar,
      creeLe: new Date().toISOString(),
      lignes: input.lignes.map((ligne, idx) => ({
        id: `BSCL-${idx + 1}`,
        date: ligne.date,
        beneficiaire: ligne.beneficiaire,
        motif: ligne.motif,
        montant: ligne.montant,
      })),
    };
    set((s) => ({
      bonsSortieCaisse: [newBon, ...s.bonsSortieCaisse],
      bonSortieCaisseSeq: seq + 1,
    }));
    await get().addAuditLog(
      AUDIT_MODULE.Bons,
      AUDIT_ACTION.Creation,
      `Bon de sortie caisse ${reference} créé — ${montantTotal.toLocaleString("fr-FR")} FCFA`,
    );
    return newBon;
  },

  updateBonSortieCaisse: async (id, input) => {
    const montantTotal = input.lignes.reduce((sum, ligne) => sum + ligne.montant, 0);
    // Persistance obligatoire — voir addBon ci-dessus pour la justification.
    const updated = await api.bons.updateBonCaisse(id, {
      date: input.date,
      annexeId: input.annexeId,
      lignes: input.lignes,
    });

    // Préfère les lignes confirmées par le serveur (ids réels) ; ne
    // reconstruit des ids locaux jetables que si la réponse est absente.
    const confirmedLignes: Array<{ id: string; date: string; beneficiaire: string; motif: string; montant: number }> =
      updated?.lignes ?? input.lignes.map((ligne, idx) => ({ ...ligne, id: `BSCL-${idx + 1}` }));

    set((s) => ({
      bonsSortieCaisse: s.bonsSortieCaisse.map((b) =>
        b.id === id
          ? {
              ...b,
              date: input.date,
              annexeId: input.annexeId,
              annexeNom: get().annexes.find((a) => a.id === input.annexeId)?.nom,
              montantTotal,
              lignes: confirmedLignes.map((ligne) => ({
                id: ligne.id,
                date: ligne.date,
                beneficiaire: ligne.beneficiaire,
                motif: ligne.motif,
                montant: Number(ligne.montant),
              })),
            }
          : b,
      ),
    }));

    const bon = get().bonsSortieCaisse.find((b) => b.id === id);
    if (bon) {
      await get().addAuditLog(
        AUDIT_MODULE.Bons,
        AUDIT_ACTION.Modification,
        `Bon de sortie caisse ${bon.reference} modifié — ${montantTotal.toLocaleString("fr-FR")} FCFA`,
      );
    }
  },

  removeBonSortieCaisse: async (id) => {
    // Persistance obligatoire — voir addBon ci-dessus pour la justification.
    await api.bons.deleteBonCaisse(id);

    const bon = get().bonsSortieCaisse.find((b) => b.id === id);
    set((s) => ({ bonsSortieCaisse: s.bonsSortieCaisse.filter((b) => b.id !== id) }));
    if (bon) {
      await get().addAuditLog(AUDIT_MODULE.Bons, AUDIT_ACTION.Suppression, `Bon de sortie caisse ${bon.reference} supprimé`);
    }
  },
});

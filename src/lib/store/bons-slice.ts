import type { StateCreator } from "zustand";
import { getConnectedUserName } from "@/lib/store/connected-user";
import type { BonLigne, BonSortie, BonSortieCaisse, BonSortieCaisseInput, Mouvement, StockItem } from "@/lib/domain-types";
import type { BonInput, SLTTState } from "@/lib/store";
import type { BonSortieCaisseRow, BonSortieRow } from "@/lib/db-rows";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

import {
  computeAnnexeScopedReference,
  extractTrailingSeq,
} from "@/lib/store/reference";

export function mapBonFromDb(row: BonSortieRow): BonSortie {
  return {
    id: row.id,
    reference: row.reference,
    date: row.date,
    clientId: row.client_id,
    clientNom: row.clients?.nom || row.client_nom || "",
    annexeId: row.annexe_id,
    annexeNom: row.annexes?.nom,
    stockId: row.stock_id || undefined,
    marchandise: row.marchandise,
    quantite: Number(row.quantite),
    unite: row.unite,
    motif: row.motif,
    montant: Number(row.montant),
    statut: row.statut,
  };
}

export function mapBonSortieCaisseFromDb(row: BonSortieCaisseRow): BonSortieCaisse {
  return {
    id: row.id,
    reference: row.reference,
    date: row.date,
    annexeId: row.annexe_id,
    annexeNom: row.annexes?.nom,
    montantTotal: Number(row.montant_total),
    creePar: row.cree_par || undefined,
    creeLe: row.created_at,
    lignes: (row.bons_sortie_caisse_lignes || []).map((ligne) => ({
      id: ligne.id,
      date: ligne.date,
      beneficiaire: ligne.beneficiaire,
      motif: ligne.motif,
      montant: Number(ligne.montant),
    })),
  };
}

export function findStockForBon(
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

    let dbId = crypto.randomUUID();
    try {
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
      if (created?.id) dbId = created.id;
    } catch (e) {
      console.warn("api.bons.createBonSortie (mode local) :", e);
    }

    const newBon: BonSortie = {
      id: dbId,
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

      try {
        await api.bons.validateBonSortie(id);
      } catch (e) {
        console.warn("api.bons.validateBonSortie (mode local) :", e);
      }

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

    try {
      await api.bons.validateBonSortie(id);
    } catch (e) {
      console.warn("api.bons.validateBonSortie (mode local) :", e);
    }

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
    let dbId = crypto.randomUUID();
    try {
      const created = await api.bons.createBonCaisse({
        reference,
        date: input.date,
        annexeId: input.annexeId,
        montantTotal,
        creePar,
        lignes: input.lignes,
      });
      if (created?.id) dbId = created.id;
    } catch (e) {
      console.warn("api.bons.createBonCaisse (mode local) :", e);
    }

    const newBon: BonSortieCaisse = {
      id: dbId,
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

  removeBonSortieCaisse: async (id) => {
    try {
      await api.bons.deleteBonCaisse(id);
    } catch (e) {
      console.warn("api.bons.deleteBonCaisse (mode local) :", e);
    }

    const bon = get().bonsSortieCaisse.find((b) => b.id === id);
    set((s) => ({ bonsSortieCaisse: s.bonsSortieCaisse.filter((b) => b.id !== id) }));
    if (bon) {
      await get().addAuditLog(AUDIT_MODULE.Bons, AUDIT_ACTION.Suppression, `Bon de sortie caisse ${bon.reference} supprimé`);
    }
  },
});

import type { StateCreator } from "zustand";
import type { Mouvement, StockItem } from "@/lib/domain-types";
import type { ImportStockHistoriqueInput, SLTTState, StockItemInput, UpdateStockItemInput } from "@/lib/store";
import type { MouvementRow, StockItemRow } from "@/lib/db-rows";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

export function mapStockItemFromDb(row: StockItemRow): StockItem {
  return {
    id: row.id,
    clientId: row.client_id || undefined,
    clientNom: row.clients?.nom || undefined,
    annexeId: row.annexe_id,
    annexeNom: row.annexes?.nom,
    marchandise: row.marchandise,
    quantite: Number(row.quantite ?? 0),
    unite: row.unite,
    seuil: Number(row.seuil ?? 0),
    depositaire: row.depositaire,
    commercial: row.commercial,
    sommePayee: Number(row.somme_payee ?? 0),
    resteAPayer: Number(row.reste_a_payer ?? 0),
    date: row.date,
  };
}

export function mapMouvementFromDb(row: MouvementRow): Mouvement {
  return {
    id: row.id,
    stockId: row.stock_id || undefined,
    annexeId: row.annexe_id,
    annexeNom: row.annexes?.nom,
    date: row.date,
    type: row.type,
    marchandise: row.marchandise || "",
    quantite: Number(row.quantite ?? 0),
    unite: row.unite || "",
    responsable: row.responsable || "",
    bonRef: row.bon_ref || undefined,
    motif: row.motif || undefined,
  };
}

export interface StockSlice {
  stock: StockItem[];
  mouvements: Mouvement[];
  stockSeq: number;
  mouvementSeq: number;
  addStockItem: (input: StockItemInput) => Promise<StockItem>;
  addStockEntry: (stockId: string, quantite: number, responsable: string) => Promise<void>;
  addStockExit: (
    stockId: string,
    quantite: number,
    responsable: string,
    bonRef?: string,
    motif?: string,
  ) => Promise<void>;
  importStockHistorique: (input: ImportStockHistoriqueInput) => Promise<StockItem>;
  updateStockItem: (id: string, input: UpdateStockItemInput) => Promise<StockItem>;
}

import { api } from "@/lib/api-client";

export const createStockSlice: StateCreator<SLTTState, [], [], StockSlice> = (set, get) => ({
  stock: [],
  mouvements: [],
  stockSeq: 1,
  mouvementSeq: 1,

  addStockItem: async (input) => {
    const seq = get().stockSeq;
    const client = get().clients.find((c) => c.id === input.clientId);
    const annexe = get().annexes.find((a) => a.id === input.annexeId);

    let dbId = crypto.randomUUID();
    try {
      const created = await api.stock.createItem({
        clientId: input.clientId,
        annexeId: input.annexeId,
        marchandise: input.marchandise,
        quantite: input.quantite,
        unite: input.unite,
        seuil: input.seuil,
        depositaire: input.depositaire,
        commercial: input.commercial,
        sommePayee: input.sommePayee,
        resteAPayer: input.resteAPayer,
        date: input.date,
      });
      if (created?.id) dbId = created.id;
    } catch (e) {
      console.warn("api.stock.createItem (mode local) :", e);
    }

    const newItem: StockItem = {
      id: dbId,
      marchandise: input.marchandise,
      quantite: input.quantite,
      unite: input.unite,
      seuil: input.seuil,
      depositaire: input.depositaire,
      commercial: input.commercial,
      sommePayee: input.sommePayee,
      resteAPayer: input.resteAPayer,
      date: input.date,
      clientId: input.clientId,
      clientNom: client?.nom,
      annexeId: input.annexeId,
      annexeNom: annexe?.nom,
    };
    set((s) => ({
      stock: [newItem, ...s.stock],
      stockSeq: seq + 1,
    }));
    await get().addAuditLog(AUDIT_MODULE.Stock, AUDIT_ACTION.Creation, `Article de stock créé : ${input.marchandise}`);
    return newItem;
  },

  addStockEntry: async (stockId, quantite, responsable) => {
    const stockItem = get().stock.find((s) => s.id === stockId);
    if (!stockItem) return;

    const newQty = stockItem.quantite + quantite;
    let dbMvtId = crypto.randomUUID();
    try {
      const created = await api.stock.createMouvement({
        stockId,
        annexeId: stockItem.annexeId,
        date: new Date().toISOString().slice(0, 10),
        type: "Entrée",
        marchandise: stockItem.marchandise,
        quantite,
        unite: stockItem.unite,
        responsable,
      });
      if (created?.id) dbMvtId = created.id;
    } catch (e) {
      console.warn("api.stock.createMouvement (mode local) :", e);
    }

    const newMouvement: Mouvement = {
      id: dbMvtId,
      annexeId: stockItem.annexeId,
      annexeNom: stockItem.annexeNom,
      date: new Date().toISOString(),
      type: "Entrée",
      marchandise: stockItem.marchandise,
      quantite,
      unite: stockItem.unite,
      responsable,
    };

    set((s) => ({
      stock: s.stock.map((item) => (item.id === stockId ? { ...item, quantite: newQty } : item)),
      mouvements: [newMouvement, ...s.mouvements],
    }));
    await get().addAuditLog(
      AUDIT_MODULE.Stock,
      AUDIT_ACTION.Modification,
      `Entrée de stock : +${quantite} ${stockItem.unite} pour ${stockItem.marchandise}`,
    );
  },

  addStockExit: async (stockId, quantite, responsable, bonRef, motif) => {
    const stockItem = get().stock.find((s) => s.id === stockId);
    if (!stockItem) return;

    if (stockItem.quantite < quantite) {
      throw new Error("Quantité supérieure au stock disponible.");
    }
    const newQty = stockItem.quantite - quantite;
    let dbMvtId = crypto.randomUUID();
    try {
      const created = await api.stock.createMouvement({
        stockId,
        annexeId: stockItem.annexeId,
        date: new Date().toISOString().slice(0, 10),
        type: "Sortie",
        marchandise: stockItem.marchandise,
        quantite,
        unite: stockItem.unite,
        responsable,
        bonRef,
        motif,
      });
      if (created?.id) dbMvtId = created.id;
    } catch (e) {
      console.warn("api.stock.createMouvement exit (mode local) :", e);
    }

    const newMouvement: Mouvement = {
      id: dbMvtId,
      annexeId: stockItem.annexeId,
      annexeNom: stockItem.annexeNom,
      date: new Date().toISOString(),
      type: "Sortie",
      marchandise: stockItem.marchandise,
      quantite,
      unite: stockItem.unite,
      responsable,
      bonRef,
      motif,
    };

    set((s) => ({
      stock: s.stock.map((item) => (item.id === stockId ? { ...item, quantite: newQty } : item)),
      mouvements: [newMouvement, ...s.mouvements],
    }));
    await get().addAuditLog(
      AUDIT_MODULE.Stock,
      AUDIT_ACTION.Modification,
      `Sortie de stock : -${quantite} ${stockItem.unite} pour ${stockItem.marchandise}`,
    );
  },

  importStockHistorique: async (input) => {
    const marchandise = input.marchandise.trim() || "Article à renommer";
    const unite = input.unite.trim() || "—";
    const key = marchandise.toLowerCase();
    const existing = get().stock.find(
      (s) =>
        s.annexeId === input.annexeId &&
        s.marchandise.trim().toLowerCase() === key,
    );

    let stockId: string;
    let effectiveMarchandise = marchandise;
    let effectiveUnite = unite;
    let baseQuantite = 0;

    if (existing) {
      stockId = existing.id;
      effectiveMarchandise = existing.marchandise;
      effectiveUnite = existing.unite;
      baseQuantite = existing.quantite;
    } else {
      stockId = crypto.randomUUID();
    }

    let netQuantite = 0;
    const movementRows: Mouvement[] = input.mouvements.map((m) => {
      netQuantite += m.type === "Entrée" ? m.quantite : -m.quantite;
      return {
        id: crypto.randomUUID(),
        stockId,
        annexeId: input.annexeId,
        date: m.date,
        type: m.type,
        marchandise: effectiveMarchandise,
        quantite: m.quantite,
        unite: effectiveUnite,
        responsable: m.responsable || "Import historique",
      };
    });

    const finalQuantite = baseQuantite + netQuantite;
    const client = input.clientId ? get().clients.find((c) => c.id === input.clientId) : undefined;
    const annexe = get().annexes.find((a) => a.id === input.annexeId);

    const newItem: StockItem = {
      id: stockId,
      marchandise: effectiveMarchandise,
      quantite: finalQuantite,
      unite: effectiveUnite,
      seuil: input.seuil,
      depositaire: input.depositaire?.trim() || "—",
      commercial: input.commercial?.trim() || "—",
      sommePayee: 0,
      resteAPayer: 0,
      date: new Date().toISOString(),
      clientId: input.clientId,
      clientNom: client?.nom ?? existing?.clientNom,
      annexeId: input.annexeId,
      annexeNom: annexe?.nom ?? existing?.annexeNom,
    };

    set((s) => ({
      stock: existing ? s.stock.map((it) => (it.id === stockId ? newItem : it)) : [newItem, ...s.stock],
      mouvements: [...movementRows, ...s.mouvements],
      stockSeq: existing ? s.stockSeq : s.stockSeq + 1,
    }));

    await get().addAuditLog(
      AUDIT_MODULE.Stock,
      existing ? AUDIT_ACTION.Modification : AUDIT_ACTION.Creation,
      existing
        ? `Import historique : ${input.mouvements.length} mouvement(s) ajoutés à l'article existant « ${effectiveMarchandise} », stock final ${finalQuantite} ${effectiveUnite}.`
        : `Import historique : article « ${effectiveMarchandise} » créé avec ${input.mouvements.length} mouvement(s), stock final ${finalQuantite} ${effectiveUnite}.`,
    );
    return newItem;
  },

  updateStockItem: async (id, input) => {
    const marchandise = input.marchandise.trim() || "Article à renommer";
    const unite = input.unite.trim() || "—";
    const existing = get().stock.find((s) => s.id === id);
    const client = input.clientId ? get().clients.find((c) => c.id === input.clientId) : undefined;

    try {
      await api.stock.updateItem(id, {
        marchandise,
        unite,
        seuil: input.seuil,
        depositaire: input.depositaire?.trim() || "—",
        commercial: input.commercial?.trim() || "—",
        sommePayee: input.sommePayee,
        resteAPayer: input.resteAPayer,
        date: input.date,
        clientId: input.clientId,
      });
    } catch (e) {
      console.warn("api.stock.updateItem (mode local) :", e);
    }

    const updated: StockItem = {
      id,
      marchandise,
      unite,
      seuil: input.seuil,
      depositaire: input.depositaire?.trim() || "—",
      commercial: input.commercial?.trim() || "—",
      sommePayee: input.sommePayee,
      resteAPayer: input.resteAPayer,
      date: input.date,
      clientId: input.clientId,
      clientNom: client?.nom ?? existing?.clientNom,
      annexeId: existing?.annexeId ?? "",
      annexeNom: existing?.annexeNom,
      quantite: existing?.quantite ?? 0,
    };

    set((s) => ({
      stock: s.stock.map((item) => (item.id === id ? updated : item)),
    }));
    await get().addAuditLog(AUDIT_MODULE.Stock, AUDIT_ACTION.Modification, `Article de stock modifié : ${marchandise}`);
    return updated;
  },
});

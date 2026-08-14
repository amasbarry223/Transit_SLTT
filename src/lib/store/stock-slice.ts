import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Mouvement, StockItem } from "@/lib/domain-types";
import type { SLTTState, StockItemInput } from "@/lib/store";
import type { MouvementRow, StockItemRow } from "@/lib/db-rows";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";

export function mapStockItemFromDb(row: StockItemRow): StockItem {
  return {
    id: row.id,
    clientId: row.client_id || undefined,
    clientNom: row.clients?.nom || undefined,
    societeId: row.societe_id,
    societeNom: row.societes?.nom || "—",
    annexeId: row.annexe_id,
    annexeNom: row.annexes?.nom,
    marchandise: row.marchandise,
    quantite: Number(row.quantite),
    unite: row.unite,
    seuil: Number(row.seuil),
    depositaire: row.depositaire,
    commercial: row.commercial,
    sommePayee: Number(row.somme_payee),
    resteAPayer: Number(row.reste_a_payer),
  };
}

export function mapMouvementFromDb(row: MouvementRow): Mouvement {
  return {
    id: row.id,
    stockId: row.stock_id || undefined,
    societeId: row.societe_id,
    societeNom: row.societes?.nom || "—",
    annexeId: row.annexe_id,
    annexeNom: row.annexes?.nom,
    date: row.date,
    type: row.type,
    marchandise: row.marchandise || "",
    quantite: Number(row.quantite),
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
}

export const createStockSlice: StateCreator<SLTTState, [], [], StockSlice> = (set, get) => ({
  stock: [],
  mouvements: [],
  stockSeq: 1,
  mouvementSeq: 1,

  addStockItem: async (input) => {
    const seq = get().stockSeq;

    const { data, error } = await supabase
      .from("stock_items")
      .insert({
        marchandise: input.marchandise,
        quantite: input.quantite,
        unite: input.unite,
        seuil: input.seuil,
        depositaire: input.depositaire,
        commercial: input.commercial,
        somme_payee: input.sommePayee,
        reste_a_payer: input.resteAPayer,
        client_id: input.clientId || null,
        societe_id: input.societeId,
        annexe_id: input.annexeId,
      })
      .select("*, clients(nom), societes(nom), annexes(nom)")
      .single();

    if (error) throw error;
    const newItem = mapStockItemFromDb(data);
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

    // Mouvement appliqué atomiquement côté serveur (quantite = quantite + delta,
    // jamais un calcul client) pour éviter une perte de mise à jour si deux
    // entrées/sorties concurrentes s'appliquent au même article.
    const { data, error } = await supabase
      .rpc("apply_stock_movement", {
        p_stock_id: stockId,
        p_delta: quantite,
        p_type: "Entrée",
        p_responsable: responsable,
      })
      .single();
    if (error) throw error;
    const result = data as { stock_id: string; stock_quantite: number; mouvement_id: string };
    const newQty = Number(result.stock_quantite);

    const newMouvement: Mouvement = {
      id: result.mouvement_id,
      societeId: stockItem.societeId,
      societeNom: stockItem.societeNom,
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

    const { data, error } = await supabase
      .rpc("apply_stock_movement", {
        p_stock_id: stockId,
        p_delta: -quantite,
        p_type: "Sortie",
        p_responsable: responsable,
        p_bon_ref: bonRef || null,
        p_motif: motif || null,
      })
      .single();
    if (error) {
      if (error.message?.includes("Stock insuffisant")) {
        throw new Error("Quantité supérieure au stock disponible.");
      }
      throw error;
    }
    const result = data as { stock_id: string; stock_quantite: number; mouvement_id: string };
    const newQty = Number(result.stock_quantite);

    const newMouvement: Mouvement = {
      id: result.mouvement_id,
      societeId: stockItem.societeId,
      societeNom: stockItem.societeNom,
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
});

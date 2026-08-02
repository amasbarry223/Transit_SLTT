import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Mouvement, StockItem } from "@/lib/domain-types";
import type { SLTTState, StockItemInput } from "@/lib/store";
import type { MouvementRow, StockItemRow } from "@/lib/db-rows";

export function mapStockItemFromDb(x: StockItemRow): StockItem {
  return {
    id: x.id,
    clientId: x.client_id || undefined,
    clientNom: x.clients?.nom || undefined,
    societeId: x.societe_id,
    societeNom: x.societes?.nom || "—",
    annexeId: x.annexe_id,
    annexeNom: x.annexes?.nom,
    marchandise: x.marchandise,
    quantite: Number(x.quantite),
    unite: x.unite,
    seuil: Number(x.seuil),
    depositaire: x.depositaire,
    commercial: x.commercial,
    sommePayee: Number(x.somme_payee),
    resteAPayer: Number(x.reste_a_payer),
  };
}

export function mapMouvementFromDb(x: MouvementRow): Mouvement {
  return {
    id: x.id,
    stockId: x.stock_id || undefined,
    societeId: x.societe_id,
    societeNom: x.societes?.nom || "—",
    annexeId: x.annexe_id,
    annexeNom: x.annexes?.nom,
    date: x.date,
    type: x.type,
    marchandise: x.marchandise || "",
    quantite: Number(x.quantite),
    unite: x.unite || "",
    responsable: x.responsable || "",
    bonRef: x.bon_ref || undefined,
    motif: x.motif || undefined,
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
    await get().addAuditLog("Stock", "Création", `Article de stock créé : ${input.marchandise}`);
    return newItem;
  },

  addStockEntry: async (stockId, quantite, responsable) => {
    const stockItem = get().stock.find((s) => s.id === stockId);
    if (!stockItem) return;

    const newQty = stockItem.quantite + quantite;

    const { error: stockErr } = await supabase.from("stock_items").update({ quantite: newQty }).eq("id", stockId);
    if (stockErr) throw stockErr;
    const { error: mvtErr } = await supabase.from("mouvements").insert({
      stock_id: stockId,
      societe_id: stockItem.societeId,
      annexe_id: stockItem.annexeId,
      type: "Entrée",
      quantite,
      date: new Date().toISOString(),
      responsable,
      marchandise: stockItem.marchandise,
      unite: stockItem.unite,
      bon_ref: null,
    });
    if (mvtErr) throw mvtErr;

    const seq = get().mouvementSeq;
    const newMouvement: Mouvement = {
      id: `M-${seq}`,
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
      mouvementSeq: seq + 1,
    }));
    await get().addAuditLog(
      "Stock",
      "Modification",
      `Entrée de stock : +${quantite} ${stockItem.unite} pour ${stockItem.marchandise}`,
    );
  },

  addStockExit: async (stockId, quantite, responsable, bonRef, motif) => {
    const stockItem = get().stock.find((s) => s.id === stockId);
    if (!stockItem) return;

    if (quantite > stockItem.quantite) {
      throw new Error("Quantité supérieure au stock disponible.");
    }
    const newQty = stockItem.quantite - quantite;

    const { data: updatedStock, error: stockErr } = await supabase
      .from("stock_items")
      .update({ quantite: newQty })
      .eq("id", stockId)
      .gte("quantite", quantite)
      .select("id")
      .maybeSingle();
    if (stockErr) throw stockErr;
    if (!updatedStock) {
      throw new Error("Stock insuffisant (mise à jour concurrente).");
    }
    const { error: mvtErr } = await supabase.from("mouvements").insert({
      stock_id: stockId,
      societe_id: stockItem.societeId,
      annexe_id: stockItem.annexeId,
      type: "Sortie",
      quantite,
      date: new Date().toISOString(),
      responsable,
      marchandise: stockItem.marchandise,
      unite: stockItem.unite,
      bon_ref: bonRef || null,
      motif: motif || null,
    });
    if (mvtErr) throw mvtErr;

    const seq = get().mouvementSeq;
    const newMouvement: Mouvement = {
      id: `M-${seq}`,
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
      mouvementSeq: seq + 1,
    }));
    await get().addAuditLog(
      "Stock",
      "Modification",
      `Sortie de stock : -${quantite} ${stockItem.unite} pour ${stockItem.marchandise}`,
    );
  },
});

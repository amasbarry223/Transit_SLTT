import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Mouvement, StockItem } from "@/lib/domain-types";
import type { ImportStockHistoriqueInput, SLTTState, StockItemInput, UpdateStockItemInput } from "@/lib/store";
import type { MouvementRow, StockItemRow } from "@/lib/db-rows";
import { AUDIT_ACTION, AUDIT_MODULE } from "@/lib/audit";
import { logError } from "@/shared/logger";

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
  importStockHistorique: (input: ImportStockHistoriqueInput) => Promise<StockItem>;
  updateStockItem: (id: string, input: UpdateStockItemInput) => Promise<StockItem>;
  deleteStockItem: (id: string) => Promise<void>;
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

  importStockHistorique: async (input) => {
    // Filet de sécurité : le nom/l'unité peuvent arriver vides depuis la
    // revue d'import (l'utilisateur préfère importer puis renommer plutôt
    // que de tout saisir avant) — ne jamais écrire de chaîne vide en base,
    // quel que soit l'appelant. Miroir du fallback de new-item-dialog.tsx.
    const marchandise = input.marchandise.trim() || "Article à renommer";
    const unite = input.unite.trim() || "—";
    const key = marchandise.toLowerCase();
    const existing = get().stock.find(
      (s) =>
        s.societeId === input.societeId &&
        s.annexeId === input.annexeId &&
        s.marchandise.trim().toLowerCase() === key,
    );
    if (existing) {
      throw new Error(
        `L'article « ${marchandise} » existe déjà pour cette société/annexe — utilisez les entrées/sorties normales pour compléter son historique.`,
      );
    }

    const { data: itemData, error: itemError } = await supabase
      .from("stock_items")
      .insert({
        marchandise,
        quantite: 0,
        unite,
        seuil: input.seuil,
        depositaire: input.depositaire?.trim() || "—",
        commercial: input.commercial?.trim() || "—",
        somme_payee: 0,
        reste_a_payer: 0,
        client_id: input.clientId || null,
        societe_id: input.societeId,
        annexe_id: input.annexeId,
      })
      .select("*, clients(nom), societes(nom), annexes(nom)")
      .single();
    if (itemError) throw itemError;
    const stockId = itemData.id as string;

    // Insert direct (pas la RPC apply_stock_movement, qui horodate toujours
    // now() et ne convient qu'à la saisie live) — les policies RLS
    // mouvements_mutate/stock_items_mutate autorisent déjà cet accès pour un
    // utilisateur stock:write avec accès à l'annexe, cf. plan.
    let netQuantite = 0;
    const movementRows = input.mouvements.map((m) => {
      netQuantite += m.type === "Entrée" ? m.quantite : -m.quantite;
      return {
        stock_id: stockId,
        societe_id: input.societeId,
        annexe_id: input.annexeId,
        date: m.date,
        type: m.type,
        marchandise,
        quantite: m.quantite,
        unite,
        responsable: m.responsable || "Import historique",
      };
    });

    const { data: mouvementsData, error: mouvementsError } = await supabase
      .from("mouvements")
      .insert(movementRows)
      .select("*, societes(nom), annexes(nom)");
    if (mouvementsError) {
      // Compensation : pas d'article orphelin sans historique si l'insert en masse échoue.
      const { error: cleanupError } = await supabase.from("stock_items").delete().eq("id", stockId);
      if (cleanupError) {
        // Ne pas avaler silencieusement : si la compensation échoue aussi
        // (policy RLS, etc.), un article fantôme quantite=0 reste en base et
        // bloquera un nouvel essai via la garde anti-doublon ci-dessus.
        logError("[stock] Échec de la compensation après échec d'insertion des mouvements", cleanupError, {
          stockId,
        });
      }
      throw mouvementsError;
    }

    const { data: updatedItem, error: updateError } = await supabase
      .from("stock_items")
      .update({ quantite: netQuantite })
      .eq("id", stockId)
      .select("*, clients(nom), societes(nom), annexes(nom)")
      .single();
    if (updateError) {
      // Compensation symétrique : à ce stade l'article ET ses mouvements sont
      // déjà en base (insert atomique réussi juste au-dessus) mais quantite
      // est resté à 0 — sans ce nettoyage, l'article reste incohérent
      // (historique présent, solde faux) et personne ne le corrige jamais
      // puisque l'appelant ne voit qu'une erreur et que le state local n'est
      // jamais mis à jour pour ce cas.
      const { error: cleanupMvtError } = await supabase.from("mouvements").delete().eq("stock_id", stockId);
      if (cleanupMvtError) {
        logError("[stock] Échec de la compensation des mouvements après échec de mise à jour du solde", cleanupMvtError, {
          stockId,
        });
      }
      const { error: cleanupItemError } = await supabase.from("stock_items").delete().eq("id", stockId);
      if (cleanupItemError) {
        logError("[stock] Échec de la compensation de l'article après échec de mise à jour du solde", cleanupItemError, {
          stockId,
        });
      }
      throw updateError;
    }

    const newItem = mapStockItemFromDb(updatedItem);
    const newMouvements = (mouvementsData ?? []).map(mapMouvementFromDb);
    set((s) => ({
      stock: [newItem, ...s.stock],
      mouvements: [...newMouvements, ...s.mouvements],
      stockSeq: s.stockSeq + 1,
    }));
    await get().addAuditLog(
      AUDIT_MODULE.Stock,
      AUDIT_ACTION.Creation,
      `Import historique : article « ${marchandise} » créé avec ${input.mouvements.length} mouvement(s), stock final ${netQuantite} ${unite}.`,
    );
    return newItem;
  },

  updateStockItem: async (id, input) => {
    const marchandise = input.marchandise.trim() || "Article à renommer";
    const unite = input.unite.trim() || "—";

    const { data, error } = await supabase
      .from("stock_items")
      .update({
        marchandise,
        unite,
        seuil: input.seuil,
        depositaire: input.depositaire?.trim() || "—",
        commercial: input.commercial?.trim() || "—",
        client_id: input.clientId || null,
      })
      .eq("id", id)
      .select("*, clients(nom), societes(nom), annexes(nom)")
      .single();
    if (error) throw error;

    const updated = mapStockItemFromDb(data);
    set((s) => ({
      stock: s.stock.map((item) => (item.id === id ? updated : item)),
    }));
    await get().addAuditLog(AUDIT_MODULE.Stock, AUDIT_ACTION.Modification, `Article de stock modifié : ${marchandise}`);
    return updated;
  },

  deleteStockItem: async (id) => {
    const item = get().stock.find((s) => s.id === id);
    if (!item) return;
    // Un article avec du stock encore présent documente une activité réelle
    // (marchandise physiquement en dépôt) — refusé pour ne pas faire
    // disparaître un stock qui existe encore ailleurs. Un article déjà vidé
    // (quantite=0) peut être supprimé même s'il a un historique de
    // mouvements : cet historique est alors supprimé avec lui (choix
    // explicite de l'utilisateur, pas un effet de bord silencieux).
    if (item.quantite !== 0) {
      throw new Error(
        "Impossible de supprimer un article qui a encore du stock — videz-le d'abord via une sortie.",
      );
    }

    const { error: mouvementsError } = await supabase.from("mouvements").delete().eq("stock_id", id);
    if (mouvementsError) throw mouvementsError;

    const { error } = await supabase.from("stock_items").delete().eq("id", id);
    if (error) throw error;

    set((s) => ({
      stock: s.stock.filter((i) => i.id !== id),
      mouvements: s.mouvements.filter((m) => m.stockId !== id),
    }));
    await get().addAuditLog(
      AUDIT_MODULE.Stock,
      AUDIT_ACTION.Suppression,
      `Article de stock supprimé : ${item.marchandise} (avec son historique de mouvements)`,
    );
  },
});

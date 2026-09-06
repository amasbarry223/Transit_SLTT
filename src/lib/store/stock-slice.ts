import type { StateCreator } from "zustand";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
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
}

export const createStockSlice: StateCreator<SLTTState, [], [], StockSlice> = (set, get) => ({
  stock: [],
  mouvements: [],
  stockSeq: 1,
  mouvementSeq: 1,

  addStockItem: async (input) => {
    const seq = get().stockSeq;

    if (!isSupabaseConfigured) {
      const client = get().clients.find((c) => c.id === input.clientId);
      const annexe = get().annexes.find((a) => a.id === input.annexeId);
      const newItem: StockItem = {
        id: crypto.randomUUID(),
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
    }

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
        date: input.date,
        client_id: input.clientId || null,
        annexe_id: input.annexeId,
      })
      .select("*, clients(nom), annexes(nom)")
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

    if (!isSupabaseConfigured) {
      const newQty = stockItem.quantite + quantite;
      const newMouvement: Mouvement = {
        id: crypto.randomUUID(),
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
      return;
    }

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

    if (!isSupabaseConfigured) {
      if (stockItem.quantite < quantite) {
        throw new Error("Quantité supérieure au stock disponible.");
      }
      const newQty = stockItem.quantite - quantite;
      const newMouvement: Mouvement = {
        id: crypto.randomUUID(),
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
      return;
    }

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
        s.annexeId === input.annexeId &&
        s.marchandise.trim().toLowerCase() === key,
    );

    // Un article déjà en base est complété (nouveaux mouvements + solde
    // cumulé) plutôt que refusé — le grand livre papier se remplit page
    // après page, l'utilisateur doit pouvoir réimporter sans tout ressaisir
    // à la main. Le nom/l'unité réels priment alors sur ceux de la revue,
    // pour ne jamais faire diverger l'affichage de ce qui existe déjà.
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
          annexe_id: input.annexeId,
        })
        .select("*, clients(nom), annexes(nom)")
        .single();
      if (itemError) throw itemError;
      stockId = itemData.id as string;
    }

    // Insert direct (pas la RPC apply_stock_movement, qui horodate toujours
    // now() et ne convient qu'à la saisie live) — les policies RLS
    // mouvements_mutate/stock_items_mutate autorisent déjà cet accès pour un
    // utilisateur stock:write avec accès à l'annexe, cf. plan.
    let netQuantite = 0;
    const movementRows = input.mouvements.map((m) => {
      netQuantite += m.type === "Entrée" ? m.quantite : -m.quantite;
      return {
        stock_id: stockId,
        annexe_id: input.annexeId,
        date: m.date,
        type: m.type,
        marchandise: effectiveMarchandise,
        quantite: m.quantite,
        unite: effectiveUnite,
        responsable: m.responsable || "Import historique",
      };
    });

    const { data: mouvementsData, error: mouvementsError } = await supabase
      .from("mouvements")
      .insert(movementRows)
      .select("*, annexes(nom)");
    if (mouvementsError) {
      // Compensation : pas d'article orphelin sans historique si l'insert en
      // masse échoue — seulement pour un article qu'on vient de créer, jamais
      // pour un article préexistant qu'on complétait.
      if (!existing) {
        const { error: cleanupError } = await supabase.from("stock_items").delete().eq("id", stockId);
        if (cleanupError) {
          // Ne pas avaler silencieusement : si la compensation échoue aussi
          // (policy RLS, etc.), un article fantôme quantite=0 reste en base et
          // bloquera un nouvel essai via la garde anti-doublon ci-dessus.
          logError("[stock] Échec de la compensation après échec d'insertion des mouvements", cleanupError, {
            stockId,
          });
        }
      }
      throw mouvementsError;
    }

    // IDs du lot qu'on vient d'insérer — la compensation ci-dessous ne doit
    // jamais toucher un mouvement préexistant d'un article complété.
    const insertedMouvementIds = (mouvementsData ?? []).map((m) => m.id as string);

    const finalQuantite = baseQuantite + netQuantite;
    const { data: updatedItem, error: updateError } = await supabase
      .from("stock_items")
      .update({ quantite: finalQuantite })
      .eq("id", stockId)
      .select("*, clients(nom), annexes(nom)")
      .single();
    if (updateError) {
      // Compensation symétrique : à ce stade les mouvements sont déjà en base
      // (insert atomique réussi juste au-dessus) mais quantite n'a pas suivi
      // — sans ce nettoyage, l'article reste incohérent (historique présent,
      // solde faux) et personne ne le corrige jamais puisque l'appelant ne
      // voit qu'une erreur et que le state local n'est jamais mis à jour. Ne
      // supprimer que les mouvements de ce lot (par id), jamais tout
      // l'historique du stock_id — un article complété peut déjà en avoir.
      const { error: cleanupMvtError } = await supabase.from("mouvements").delete().in("id", insertedMouvementIds);
      if (cleanupMvtError) {
        logError("[stock] Échec de la compensation des mouvements après échec de mise à jour du solde", cleanupMvtError, {
          stockId,
        });
      }
      if (!existing) {
        const { error: cleanupItemError } = await supabase.from("stock_items").delete().eq("id", stockId);
        if (cleanupItemError) {
          logError("[stock] Échec de la compensation de l'article après échec de mise à jour du solde", cleanupItemError, {
            stockId,
          });
        }
      }
      throw updateError;
    }

    const newItem = mapStockItemFromDb(updatedItem);
    const newMouvements = (mouvementsData ?? []).map(mapMouvementFromDb);
    set((s) => ({
      stock: existing ? s.stock.map((it) => (it.id === newItem.id ? newItem : it)) : [newItem, ...s.stock],
      mouvements: [...newMouvements, ...s.mouvements],
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

    if (!isSupabaseConfigured) {
      const existing = get().stock.find((s) => s.id === id);
      const client = input.clientId ? get().clients.find((c) => c.id === input.clientId) : undefined;
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
    }

    const { data, error } = await supabase
      .from("stock_items")
      .update({
        marchandise,
        unite,
        seuil: input.seuil,
        depositaire: input.depositaire?.trim() || "—",
        commercial: input.commercial?.trim() || "—",
        somme_payee: input.sommePayee,
        reste_a_payer: input.resteAPayer,
        date: input.date,
        client_id: input.clientId || null,
      })
      .eq("id", id)
      .select("*, clients(nom), annexes(nom)")
      .single();
    if (error) throw error;

    const updated = mapStockItemFromDb(data);
    set((s) => ({
      stock: s.stock.map((item) => (item.id === id ? updated : item)),
    }));
    await get().addAuditLog(AUDIT_MODULE.Stock, AUDIT_ACTION.Modification, `Article de stock modifié : ${marchandise}`);
    return updated;
  },
});

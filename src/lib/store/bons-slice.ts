import type { StateCreator } from "zustand";
import { supabase } from "@/lib/supabase";
import { getConnectedUserName } from "@/lib/store/connected-user";
import type { BonSortie, BonSortieCaisse, BonSortieCaisseInput, StockItem } from "@/lib/domain-types";
import type { BonInput, SLTTState } from "@/lib/store";
import type { BonSortieCaisseRow, BonSortieRow } from "@/lib/db-rows";

import { computeAnnexeScopedReference } from "@/lib/store/reference";

export function mapBonFromDb(row: BonSortieRow): BonSortie {
  return {
    id: row.id,
    reference: row.reference,
    date: row.date,
    clientId: row.client_id,
    clientNom: row.clients?.nom || row.client_nom || "",
    societeId: row.societe_id,
    societeNom: row.societes?.nom || "—",
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
    societeId: row.societe_id,
    societeNom: row.societes?.nom || "—",
    annexeId: row.annexe_id,
    annexeNom: row.annexes?.nom,
    montantTotal: Number(row.montant_total),
    creePar: row.cree_par || undefined,
    creeLe: row.created_at,
    lignes: (row.bons_sortie_caisse_lignes || []).map((l) => ({
      id: l.id,
      date: l.date,
      beneficiaire: l.beneficiaire,
      motif: l.motif,
      montant: Number(l.montant),
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

export const createBonsSlice: StateCreator<SLTTState, [], [], BonsSlice> = (set, get) => ({
  bons: [],
  bonSeq: 1,
  bonsSortieCaisse: [],
  bonSortieCaisseSeq: 1,

  addBon: async (input) => {
    const societe = get().societes.find((s) => s.id === input.societeId);
    const annexe = get().annexes.find((a) => a.id === input.annexeId);
    const { reference: numero, useAnnexeNumbering, seq } = computeAnnexeScopedReference(
      societe,
      annexe,
      "BS",
      get().bons.map((b) => b.reference),
      get().bonSeq,
    );

    const { data, error } = await supabase
      .from("bons_sortie")
      .insert({
        reference: numero,
        date: input.date,
        client_id: input.clientId,
        societe_id: input.societeId,
        annexe_id: input.annexeId,
        stock_id: input.stockId,
        marchandise: input.marchandise,
        quantite: input.quantite,
        unite: input.unite,
        motif: input.motif,
        montant: input.montant,
        statut: "Brouillon",
      })
      .select("*, clients(nom), societes(nom), annexes(nom)")
      .single();

    if (error) throw error;
    const newBon = mapBonFromDb(data);
    set((s) => ({
      bons: [newBon, ...s.bons],
      bonSeq: useAnnexeNumbering ? s.bonSeq : seq + 1,
    }));
    await get().addAuditLog("Bons", "Création", `Bon ${numero} créé`);

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

    const { data, error } = await supabase
      .rpc("validate_bon_sortie", {
        p_bon_id: id,
        p_responsable: getConnectedUserName(),
      })
      .single();
    if (error) {
      if (/stock insuffisant/i.test(error.message)) return false;
      throw error;
    }
    const result = data as { bon: BonSortieRow; mouvement_id: string };

    const stockItem = findStockForBon(get().stock, bon);
    set((s) => ({
      bons: s.bons.map((b) => (b.id === id ? { ...b, statut: "Validé" } : b)),
      stock: stockItem
        ? s.stock.map((item) =>
            item.id === stockItem.id
              ? { ...item, quantite: Math.max(0, item.quantite - bon.quantite) }
              : item,
          )
        : s.stock,
      mouvements: [
        {
          id: result.mouvement_id,
          societeId: stockItem?.societeId || bon.societeId,
          societeNom: stockItem?.societeNom || bon.societeNom,
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
    await get().addAuditLog("Bons", "Validation", `Bon de sortie ${bon.reference} validé`);
    return true;
  },

  addBonSortieCaisse: async (input) => {
    const seq = get().bonSortieCaisseSeq;
    const reference = `N°${seq}`;
    const creePar = getConnectedUserName();
    const montantTotal = input.lignes.reduce((sum, l) => sum + l.montant, 0);

    const { data: dbBon, error: errBon } = await supabase
      .from("bons_sortie_caisse")
      .insert({
        reference,
        date: input.date,
        societe_id: input.societeId,
        annexe_id: input.annexeId,
        montant_total: montantTotal,
        cree_par: creePar,
      })
      .select()
      .single();
    if (errBon) throw errBon;

    if (input.lignes.length > 0) {
      const { error: errLignes } = await supabase
        .from("bons_sortie_caisse_lignes")
        .insert(
          input.lignes.map((l) => ({
            bon_id: dbBon.id,
            date: l.date,
            beneficiaire: l.beneficiaire,
            motif: l.motif,
            montant: l.montant,
          })),
        );
      if (errLignes) throw errLignes;
    }

    const { data: fullBon, error: errFetch } = await supabase
      .from("bons_sortie_caisse")
      .select("*, bons_sortie_caisse_lignes(*), societes(nom), annexes(nom)")
      .eq("id", dbBon.id)
      .single();
    if (errFetch) throw errFetch;

    const newBon = mapBonSortieCaisseFromDb(fullBon);
    set((s) => ({
      bonsSortieCaisse: [newBon, ...s.bonsSortieCaisse],
      bonSortieCaisseSeq: seq + 1,
    }));
    await get().addAuditLog(
      "Bons",
      "Création",
      `Bon de sortie caisse ${reference} créé — ${montantTotal.toLocaleString("fr-FR")} FCFA`,
    );
    return newBon;
  },

  removeBonSortieCaisse: async (id) => {
    const bon = get().bonsSortieCaisse.find((b) => b.id === id);
    const { error } = await supabase.from("bons_sortie_caisse").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ bonsSortieCaisse: s.bonsSortieCaisse.filter((b) => b.id !== id) }));
    if (bon) {
      await get().addAuditLog("Bons", "Suppression", `Bon de sortie caisse ${bon.reference} supprimé`);
    }
  },
});

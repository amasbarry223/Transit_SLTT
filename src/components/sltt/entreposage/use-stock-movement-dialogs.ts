"use client";

import { useState } from "react";
import { useStore, type StockItem } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-permission";

export const SORTIE_MOTIFS = ["Vente", "Livraison", "Transfert", "Autre"] as const;
export type SortieMotif = (typeof SORTIE_MOTIFS)[number];

export function useStockMovementDialogs(stock: StockItem[]) {
  const { toast } = useToast();
  const currentUser = useCurrentUser();
  const addStockEntry = useStore((s) => s.addStockEntry);
  const addStockExit = useStore((s) => s.addStockExit);

  const [entryOpen, setEntryOpen] = useState(false);
  const [entryStockId, setEntryStockId] = useState<string>("");
  const [entryQty, setEntryQty] = useState<string>("1");
  const [entryResp, setEntryResp] = useState<string>("");

  const [exitOpen, setExitOpen] = useState(false);
  const [exitStockId, setExitStockId] = useState<string>("");
  const [exitQty, setExitQty] = useState<string>("1");
  const [exitResp, setExitResp] = useState<string>("");
  const [exitMotif, setExitMotif] = useState<SortieMotif>("Vente");

  function openEntry(stockId: string | null) {
    const id = stockId ?? stock[0]?.id ?? "";
    setEntryStockId(id);
    setEntryQty("1");
    setEntryResp(currentUser?.nom ?? "");
    setEntryOpen(true);
  }

  function openExit(stockId: string | null) {
    const id = stockId ?? stock[0]?.id ?? "";
    setExitStockId(id);
    setExitQty("1");
    setExitResp(currentUser?.nom ?? "");
    setExitMotif("Vente");
    setExitOpen(true);
  }

  async function submitEntry() {
    if (!entryStockId) return;
    const qty = parseInt(entryQty, 10);
    if (!qty || qty <= 0) return;
    try {
      await addStockEntry(entryStockId, qty, entryResp.trim() || currentUser?.nom || "Système");
      toast({ title: "Entrée enregistrée — stock mis à jour" });
      setEntryOpen(false);
    } catch (err: unknown) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible d'enregistrer l'entrée.",
        variant: "destructive",
      });
    }
  }

  async function submitExit() {
    if (!exitStockId) return;
    const qty = parseInt(exitQty, 10);
    if (!qty || qty <= 0) return;
    const item = stock.find((s) => s.id === exitStockId);
    if (!item || qty > item.quantite) return;
    try {
      await addStockExit(exitStockId, qty, exitResp.trim() || currentUser?.nom || "Système", undefined, exitMotif);
      toast({ title: "Sortie enregistrée — stock décrémenté" });
      setExitOpen(false);
    } catch (err: unknown) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible d'enregistrer la sortie.",
        variant: "destructive",
      });
    }
  }

  const entryQtyNum = parseInt(entryQty, 10) || 0;
  const entryDisabled = !entryStockId || entryQtyNum <= 0;

  const exitStock = stock.find((s) => s.id === exitStockId);
  const exitQtyNum = parseInt(exitQty, 10) || 0;
  const exitOverflow = exitStock != null && exitQtyNum > exitStock.quantite;
  const exitDisabled = !exitStockId || exitQtyNum <= 0 || exitOverflow;

  return {
    entryOpen,
    setEntryOpen,
    entryStockId,
    setEntryStockId,
    entryQty,
    setEntryQty,
    entryResp,
    setEntryResp,
    exitOpen,
    setExitOpen,
    exitStockId,
    setExitStockId,
    exitQty,
    setExitQty,
    exitResp,
    setExitResp,
    exitMotif,
    setExitMotif,
    openEntry,
    openExit,
    submitEntry,
    submitExit,
    entryDisabled,
    exitStock,
    exitOverflow,
    exitDisabled,
  };
}

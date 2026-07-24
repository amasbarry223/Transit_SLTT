"use client";

import type { StockItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StockMovementFields } from "@/components/sltt/stock-movement-fields";
import { SORTIE_MOTIFS, type SortieMotif, type useStockMovementDialogs } from "./use-stock-movement-dialogs";

export function EntryExitDialogs({
  stock,
  dialogs,
}: {
  stock: StockItem[];
  dialogs: ReturnType<typeof useStockMovementDialogs>;
}) {
  return (
    <>
      <Dialog open={dialogs.entryOpen} onOpenChange={dialogs.setEntryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Entrée de marchandise</DialogTitle>
            <DialogDescription className="sr-only">
              Enregistrer une entrée de stock et mettre à jour la quantité
              disponible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="entry-marchandise" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Marchandise
              </Label>
              <Select value={dialogs.entryStockId} onValueChange={dialogs.setEntryStockId}>
                <SelectTrigger id="entry-marchandise" className="h-10 w-full">
                  <SelectValue placeholder="Sélectionner une marchandise" />
                </SelectTrigger>
                <SelectContent>
                  {stock.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.marchandise} (stock : {s.quantite} {s.unite})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <StockMovementFields
              idPrefix="entry"
              qty={dialogs.entryQty}
              onQtyChange={dialogs.setEntryQty}
              responsable={dialogs.entryResp}
              onResponsableChange={dialogs.setEntryResp}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => dialogs.setEntryOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={dialogs.submitEntry} disabled={dialogs.entryDisabled}>
              Valider l&apos;entrée
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogs.exitOpen} onOpenChange={dialogs.setExitOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sortie de marchandise</DialogTitle>
            <DialogDescription className="sr-only">
              Enregistrer une sortie de stock et décrémenter la quantité
              disponible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exit-marchandise" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Marchandise
              </Label>
              <Select value={dialogs.exitStockId} onValueChange={dialogs.setExitStockId}>
                <SelectTrigger id="exit-marchandise" className="h-10 w-full">
                  <SelectValue placeholder="Sélectionner une marchandise" />
                </SelectTrigger>
                <SelectContent>
                  {stock.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.marchandise} (stock : {s.quantite} {s.unite})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exit-qty" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Quantité à sortir
              </Label>
              <Input
                id="exit-qty"
                type="number"
                min={1}
                value={dialogs.exitQty}
                onChange={(e) => dialogs.setExitQty(e.target.value)}
                className="h-10"
                aria-invalid={dialogs.exitOverflow}
              />
              {dialogs.exitOverflow && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  La quantité dépasse le stock disponible ({dialogs.exitStock?.quantite}{" "}
                  {dialogs.exitStock?.unite}).
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="exit-resp" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Responsable
              </Label>
              <Input
                id="exit-resp"
                value={dialogs.exitResp}
                onChange={(e) => dialogs.setExitResp(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exit-motif" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Motif
              </Label>
              <Select
                value={dialogs.exitMotif}
                onValueChange={(v) => dialogs.setExitMotif(v as SortieMotif)}
              >
                <SelectTrigger id="exit-motif" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORTIE_MOTIFS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => dialogs.setExitOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={dialogs.submitExit} disabled={dialogs.exitDisabled}>
              Valider la sortie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

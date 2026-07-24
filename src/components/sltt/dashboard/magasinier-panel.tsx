"use client";

import { ArrowRight, CheckCircle2, Package, Plus, Warehouse } from "lucide-react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function MagasinierPanel({ go }: { go: (v: "entreposage" | "bons", opts?: { id?: string | null }) => void }) {
  const stock = useStore((s) => s.stock);
  const bons = useStore((s) => s.bons);
  const lowStock = stock.filter((s) => s.quantite < s.seuil);
  const bonsBrouillon = bons.filter((b) => b.statut === "Brouillon");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card className="border-border/80 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">État du stock</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{stock.length} articles gérés</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => go("entreposage")}>
            Stock <ArrowRight className="ml-1 size-3.5" />
          </Button>
        </div>
        {stock.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-6 text-center">
            <Warehouse className="size-7 text-slate-200 dark:text-slate-700" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Aucun article en stock.</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Ajoutez votre premier article depuis l'Entreposage.</p>
          </div>
        ) : stock.slice(0, 4).map((s) => {
          const pct = Math.min(100, Math.round((s.quantite / Math.max(1, s.seuil * 2)) * 100));
          const low = s.quantite < s.seuil;
          return (
            <div key={s.id} className="mb-3 last:mb-0">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[60%]">{s.marchandise}</span>
                <span className={`tabular-nums font-semibold ${low ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-300"}`}>
                  {s.quantite} {s.unite}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-1.5 rounded-full transition-[width] ${low ? "bg-red-400" : "bg-emerald-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {lowStock.length > 0 && (
          <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-400">⚠ {lowStock.length} article{lowStock.length > 1 ? "s" : ""} sous le seuil</p>
        )}
      </Card>

      <Card className="border-border/80 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Bons en attente</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{bonsBrouillon.length} brouillon{bonsBrouillon.length !== 1 ? "s" : ""} à valider</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => go("bons")}>
              Bons <ArrowRight className="ml-1 size-3.5" />
            </Button>
            <Button size="sm" onClick={() => go("bons", { id: "new" })}>
              <Plus className="mr-1 size-3.5" /> Nouveau bon
            </Button>
          </div>
        </div>
        {bonsBrouillon.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="size-8 text-emerald-300" />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Aucun bon en attente</p>
          </div>
        ) : (
          bonsBrouillon.slice(0, 4).map((b) => (
            <div key={b.id} className="mb-3 flex items-center gap-3 last:mb-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40">
                <Package className="size-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{b.reference}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{b.marchandise} · {b.quantite} {b.unite}</p>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

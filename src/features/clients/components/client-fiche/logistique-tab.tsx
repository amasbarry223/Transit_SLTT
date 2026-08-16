"use client";

import { Package } from "lucide-react";
import type { BonSortie, Mouvement, StockItem } from "@/lib/domain-types";
import { TabsContent } from "@/components/ui/tabs";
import { StockTab } from "./stock-tab";
import { BonsTab } from "./bons-tab";

type LogistiqueTabProps = {
  stockItems: StockItem[];
  clientMouvements: Mouvement[];
  bons: BonSortie[];
  pagedBons: BonSortie[];
  bonSafePage: number;
  bonPages: number;
  onBonPageChange: (page: number) => void;
  onOpenEntreposage: () => void;
};

/** Onglet fusionné Stock + Bons de sortie pour alléger la fiche client. */
export function LogistiqueTab({
  stockItems,
  clientMouvements,
  bons,
  pagedBons,
  bonSafePage,
  bonPages,
  onBonPageChange,
  onOpenEntreposage,
}: LogistiqueTabProps) {
  return (
    <TabsContent value="logistique" className="mt-6 space-y-8 focus-visible:outline-none">
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Package className="size-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Stock entreposé</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {stockItems.length}
          </span>
        </div>
        <StockTab
          embedded
          stockItems={stockItems}
          clientMouvements={clientMouvements}
          onOpenEntreposage={onOpenEntreposage}
        />
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Package className="size-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Bons de sortie</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {bons.length}
          </span>
        </div>
        <BonsTab
          embedded
          bons={bons}
          pagedBons={pagedBons}
          bonSafePage={bonSafePage}
          bonPages={bonPages}
          onPageChange={onBonPageChange}
        />
      </section>
    </TabsContent>
  );
}

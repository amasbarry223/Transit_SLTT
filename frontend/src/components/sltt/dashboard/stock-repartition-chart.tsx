"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Package } from "lucide-react";
import { Card } from "@/shared/components/ui/card";

export function StockRepartitionChart({
  data,
  totalValue,
}: {
  data: { name: string; value: number; color: string }[];
  totalValue: number;
}) {
  return (
    <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-primary">
          <Package className="size-4" />
        </div>
        <h2 className="text-base font-bold text-foreground tracking-tight">
          Répartition du stock
        </h2>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 py-8 text-center">
          <p className="text-sm font-medium text-foreground/90">Aucun stock valorisé</p>
          <p className="max-w-[220px] text-xs text-muted-foreground">
            La répartition apparaît dès qu&apos;un article de stock a une valeur (payée ou restant due).
          </p>
        </div>
      ) : (
        <>
          {/* Donut Chart */}
          <div className="relative size-36 sm:size-40 mx-auto my-2 shrink-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={46}
                  outerRadius={65}
                  paddingAngle={3}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[11px] font-medium text-muted-foreground">Total</span>
              <span className="text-base sm:text-lg font-black text-foreground tabular-nums leading-tight">
                {totalValue.toLocaleString("fr-FR")}
              </span>
            </div>
          </div>

          {/* Legende — pourcentage réel de chaque poste dans la valeur totale */}
          <div className="flex flex-col gap-1.5 pt-1 text-xs">
            {data.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
                  <span className="font-medium text-muted-foreground">{entry.name}</span>
                </div>
                <span className="font-bold tabular-nums text-foreground">
                  {totalValue > 0 ? Math.round((entry.value / totalValue) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

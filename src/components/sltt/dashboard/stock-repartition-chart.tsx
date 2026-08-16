"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Package, PieChart as PieChartIcon } from "lucide-react";
import { formatFCFA } from "@/lib/format";
import { Card } from "@/components/ui/card";

export function StockRepartitionChart({
  data,
  totalValue,
}: {
  data: { name: string; value: number; color: string }[];
  totalValue: number;
}) {
  return (
    <Card className="gap-0 rounded-xl border-border/80 p-0 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <PieChartIcon className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Répartition du stock</h2>
        </div>
        <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-500 bg-muted dark:text-slate-400">
          {formatFCFA(totalValue, false)}
        </span>
      </div>

      {totalValue === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Package className="size-7 text-muted-foreground/70" />
          <p className="mt-2 text-xs text-muted-foreground">Aucune valeur en stock</p>
        </div>
      ) : (
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="relative h-28 w-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={32}
                  outerRadius={50}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2.5">
            {data.map((entry) => {
              const pct = Math.round((entry.value / totalValue) * 100);
              return (
                <div key={entry.name} className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: entry.color }} />
                    <span className="truncate text-muted-foreground">{entry.name}</span>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums text-foreground">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

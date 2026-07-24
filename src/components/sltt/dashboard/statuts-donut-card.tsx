"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { FolderKanban, PieChart as PieChartIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function StatutsDonutCard({
  data,
  totalDossiers,
}: {
  data: { name: string; value: number; color: string }[];
  totalDossiers: number;
}) {
  return (
    <Card className="gap-0 p-0 shadow-sm border-border/80 rounded-xl">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <PieChartIcon className="size-4 text-slate-400 dark:text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Par statut</h2>
        </div>
        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">
          {totalDossiers} dossier{totalDossiers > 1 ? "s" : ""}
        </span>
      </div>

      {totalDossiers === 0 ? (
        <div className="flex flex-col items-center justify-center py-8">
          <FolderKanban className="size-7 text-slate-200 dark:text-slate-700" />
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Aucun dossier</p>
        </div>
      ) : (
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="relative h-24 w-24 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={30}
                  outerRadius={46}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold tabular-nums leading-none text-slate-900 dark:text-slate-100">{totalDossiers}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">total</span>
            </div>
          </div>

          <div className="flex-1 space-y-2.5">
            {data.map((entry) => {
              const pct = Math.round((entry.value / totalDossiers) * 100);
              return (
                <div key={entry.name}>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: entry.color }} />
                    <span className="flex-1 truncate text-xs text-slate-600 dark:text-slate-300">{entry.name}</span>
                    <span className="text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">{entry.value}</span>
                    <span className="w-7 text-right text-[11px] tabular-nums text-slate-400 dark:text-slate-500">{pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: entry.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

import { Percent } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/sltt/empty-state";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PieTooltip } from "./chart-tooltips";

interface PieDatum {
  name: string;
  value: number;
  color: string;
}

interface RepartitionCardProps {
  pieData: PieDatum[];
  pieTotal: number;
  tauxRecouvrement: number;
}

export function RepartitionCard({ pieData, pieTotal, tauxRecouvrement }: RepartitionCardProps) {
  return (
    <Card className="p-5 shadow-sm border-border/80 lg:col-span-1 gap-4">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Répartition</h2>
      {pieTotal === 0 ? (
        <EmptyState icon={Percent} title="Aucune donnée pour cette période." />
      ) : (
        <>
          <div className="relative h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={86}
                  paddingAngle={2}
                  stroke="none"
                >
                  {pieData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
              <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {formatFCFA(pieTotal)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {pieData.map((d) => {
              const pct =
                pieTotal > 0 ? (d.value / pieTotal) * 100 : 0;
              return (
                <div
                  key={d.name}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: d.color }}
                  />
                  <span className="text-slate-600 dark:text-slate-300">{d.name}</span>
                  <span className="ml-auto font-medium tabular-nums text-slate-900 dark:text-slate-100">
                    {formatFCFA(d.value)}
                  </span>
                  <span className="w-10 text-right text-xs tabular-nums text-slate-400 dark:text-slate-500">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
            <div className="mt-2 rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Taux de recouvrement</p>
              <p
                className={cn(
                  "mt-0.5 text-xl font-bold tabular-nums",
                  tauxRecouvrement >= 80
                    ? "text-emerald-600 dark:text-emerald-400"
                    : tauxRecouvrement >= 50
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400",
                )}
              >
                {tauxRecouvrement} %
              </p>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

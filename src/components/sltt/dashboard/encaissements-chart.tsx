"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import { formatFCFACompact } from "@/lib/format";
import { SLTT_BLUE } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { EncaissementsTooltip } from "./chart-tooltips";

export function EncaissementsChart({
  data,
  gridColor,
  tickColor,
  barCursorFill,
}: {
  data: { mois: string; valeur: number }[];
  gridColor: string;
  tickColor: string;
  barCursorFill: string;
}) {
  const hasData = data.some((d) => d.valeur !== 0);

  return (
    <Card className="p-5 shadow-sm border-border/80 rounded-xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Encaissements par mois
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">6 derniers mois</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-block size-2.5 rounded-sm bg-[#1E40AF]" />
          Encaissé (FCFA)
        </div>
      </div>
      {!hasData ? (
        <div className="flex h-[280px] flex-col items-center justify-center gap-1 text-center">
          <BarChart3 className="size-7 text-slate-200 dark:text-slate-700" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Aucun encaissement pour l&apos;instant.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Ce graphique s&apos;alimente dès vos premiers paiements enregistrés.</p>
        </div>
      ) : (
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              vertical={false}
            />
            <XAxis
              dataKey="mois"
              tick={{ fontSize: 12, fill: tickColor }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: tickColor }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(v: number) => formatFCFACompact(v)}
            />
            <Tooltip
              content={<EncaissementsTooltip />}
              cursor={{ fill: barCursorFill, fillOpacity: 0.7 }}
            />
            <Bar dataKey="valeur" fill={SLTT_BLUE} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      )}
    </Card>
  );
}

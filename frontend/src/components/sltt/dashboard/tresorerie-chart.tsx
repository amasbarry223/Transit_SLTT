"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Wallet, ChevronDown } from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { formatFCFA, formatFCFACompact } from "@/lib/format";

interface TresorerieMoisPoint {
  mois: string;
  entrees: number;
  sorties: number;
}

export function TresorerieChart({
  data,
  gridColor,
  tickColor,
}: {
  data: TresorerieMoisPoint[];
  gridColor: string;
  tickColor: string;
}) {
  const chartData = useMemo(
    () =>
      (data || []).map((d) => ({
        mois: d.mois,
        entrees: d.entrees ?? 0,
        sorties: d.sorties ?? 0,
      })),
    [data],
  );

  const hasData = chartData.some((d) => d.entrees > 0 || d.sorties > 0);

  return (
    <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-primary">
              <Wallet className="size-4" />
            </div>
            <h2 className="text-base font-bold text-foreground tracking-tight">
              Trésorerie mensuelle
            </h2>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-slate-50/70 dark:bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span>{chartData.length} derniers mois</span>
            <ChevronDown className="size-3.5" />
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-end gap-5 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-foreground">
            <span className="size-2.5 rounded-full bg-[#2563EB]" />
            <span className="text-muted-foreground text-[11px]">Entrées</span>
          </div>
          <div className="flex items-center gap-1.5 text-foreground">
            <span className="size-2.5 rounded-full bg-[#ED1C24]" />
            <span className="text-muted-foreground text-[11px]">Sorties</span>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 py-8 text-center">
          <p className="text-sm font-medium text-foreground/90">Aucune opération comptable sur cette période</p>
          <p className="max-w-[260px] text-xs text-muted-foreground">
            La courbe apparaît dès qu&apos;une entrée ou une sortie est enregistrée au cours des{" "}
            {chartData.length} derniers mois.
          </p>
        </div>
      ) : (
        <div className="h-[210px] w-full min-w-0 pt-2">
          <ResponsiveContainer width="100%" height={210} minWidth={0}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} opacity={0.4} />
              <XAxis
                dataKey="mois"
                tick={{ fontSize: 10, fill: tickColor, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: tickColor, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatFCFACompact}
                width={44}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="rounded-xl border border-border bg-popover/95 p-2.5 text-xs shadow-lg backdrop-blur-sm">
                      <p className="font-bold text-foreground mb-1">{label}</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[#2563EB]">
                          <span className="size-2 rounded-full bg-[#2563EB]" />
                          <span className="font-medium text-foreground">Entrées :</span>
                          <span className="font-bold tabular-nums ml-auto">
                            {formatFCFA(Number(payload[0]?.value ?? 0))}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[#ED1C24]">
                          <span className="size-2 rounded-full bg-[#ED1C24]" />
                          <span className="font-medium text-foreground">Sorties :</span>
                          <span className="font-bold tabular-nums ml-auto">
                            {formatFCFA(Number(payload[1]?.value ?? 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="entrees"
                stroke="#2563EB"
                strokeWidth={2.5}
                fill="#2563EB"
                fillOpacity={0.14}
                dot={{ r: 3.5, fill: "#2563EB", strokeWidth: 2, stroke: "#ffffff" }}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="sorties"
                stroke="#ED1C24"
                strokeWidth={2.5}
                fill="#ED1C24"
                fillOpacity={0.14}
                dot={{ r: 3.5, fill: "#ED1C24", strokeWidth: 2, stroke: "#ffffff" }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

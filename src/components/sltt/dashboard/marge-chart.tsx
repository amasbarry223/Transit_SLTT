"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { formatFCFACompact } from "@/lib/format";
import { CHART_COLORS, SLTT_BLUE } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { EcartsTooltip } from "./chart-tooltips";

export function MargeChart({
  data,
  gridColor,
  tickColor,
  lineCursorStroke,
}: {
  data: { periode: string; ecart: number }[];
  gridColor: string;
  tickColor: string;
  lineCursorStroke: string;
}) {
  const hasData = data.some((d) => d.ecart !== 0);

  return (
    <Card className="p-5 shadow-sm border-border/80 rounded-xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Marge de prestation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Frais de prestation facturés − droits de douane et frais de circuit engagés, par dossier créé dans le mois
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="inline-block size-2.5 rounded-full bg-[#059669]" />
            Marge positive
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block size-2.5 rounded-full bg-[#DC2626]" />
            Marge négative
          </span>
        </div>
      </div>
      {!hasData ? (
        <div className="flex h-[280px] flex-col items-center justify-center gap-1 text-center">
          <TrendingUp className="size-7 text-slate-200 dark:text-slate-700" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Aucune marge à afficher pour l&apos;instant.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Créez un dossier avec des frais de prestation pour voir apparaître cette courbe.</p>
        </div>
      ) : (
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              vertical={false}
            />
            <XAxis
              dataKey="periode"
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
              content={<EcartsTooltip />}
              cursor={{ stroke: lineCursorStroke, strokeWidth: 1 }}
            />
            <ReferenceLine y={0} stroke={lineCursorStroke} strokeDasharray="4 3" />
            <Line
              type="monotone"
              dataKey="ecart"
              stroke={SLTT_BLUE}
              strokeWidth={2.5}
              dot={(props) => {
                const { cx, cy, payload } = props as { cx: number; cy: number; payload: { ecart: number } };
                return (
                  <circle
                    key={`dot-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={payload.ecart >= 0 ? CHART_COLORS.emerald : CHART_COLORS.red}
                    stroke="white"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      )}
    </Card>
  );
}

"use client";

import { useUiPrefs } from "@/lib/session/ui-prefs-store";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { CHART_COLORS } from "@/lib/constants";
import { formatFCFACompact } from "@/lib/format";
import { ChartTooltip } from "./chart-tooltips";
import { currentYearMonth } from "./shared";

interface EvolutionChartCardProps {
  chartData: Array<{ periode: string; investi: number; encaisse: number }>;
  mois: string;
}

export function EvolutionChartCard({ chartData, mois }: EvolutionChartCardProps) {
  const theme = useUiPrefs((s) => s.theme);
  const isDark = theme === "dark";
  // Recharts SVG props n'héritent pas des classes `dark:` (voir dashboard.tsx) —
  // ces couleurs doivent être calculées explicitement selon le thème.
  const gridColor = isDark ? "#27283F" : "#D2DBE9";
  const tickColor = isDark ? "#92A3BA" : "#6B7280";
  const barCursorFill = isDark ? "rgba(39,40,63,0.5)" : "rgba(243,245,247,0.6)";

  return (
    <Card className="p-5 shadow-sm border-border/80 gap-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Évolution des encaissements
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Investi vs encaissé — mois par mois —{" "}
          {(mois || currentYearMonth()).split("-")[0]}
        </p>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            barGap={2}
            barCategoryGap="30%"
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
              tickFormatter={(v) => formatFCFACompact(Number(v))}
              tick={{ fontSize: 12, fill: tickColor }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: barCursorFill }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="investi"
              name="Investi"
              fill={CHART_COLORS.blue}
              radius={[3, 3, 0, 0]}
            />
            <Bar
              dataKey="encaisse"
              name="Encaissé"
              fill={CHART_COLORS.emerald}
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

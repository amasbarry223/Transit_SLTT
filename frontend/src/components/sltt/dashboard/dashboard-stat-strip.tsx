"use client";

import type { LucideIcon } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer } from "recharts";
import { cn } from "@/shared/utils/cn";

export interface DashboardStat {
  key: string;
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Variation réelle (%) vs le mois précédent — omise pour un état
   *  instantané (ex. "en cours") qui n'a pas de sens comparé mois/mois. */
  trend?: number;
  /** Série mensuelle (CHART_MONTHS_COUNT points, le plus récent en dernier)
   *  pour le mini-graphique — même contrainte que trend : uniquement pour
   *  un flux d'éléments créés, jamais un état instantané. */
  series?: number[];
  onClick?: () => void;
}

// Mêmes couleurs que le badge de tendance juste en dessous (émeraude/rouge) —
// pas une palette de graphique indépendante qui contredirait le texte à côté.
const SPARK_COLOR_UP = "#059669";
const SPARK_COLOR_DOWN = "#ED1C24";

/** Mini-graphique en barres — le mois courant ressort en plein, l'historique
 *  reste discret : la barre pleine porte l'œil sur "où on en est", les
 *  barres passées ne font que donner le contexte. */
function Sparkbar({ series, trend }: { series: number[]; trend?: number }) {
  const color = (trend ?? 0) < 0 ? SPARK_COLOR_DOWN : SPARK_COLOR_UP;
  const data = series.map((valeur, i) => ({ valeur, i }));
  const lastIndex = series.length - 1;

  return (
    <div className="h-7 w-16 shrink-0" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barGap={2}>
          <Bar dataKey="valeur" radius={[1, 1, 0, 0]} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.i} fill={color} fillOpacity={d.i === lastIndex ? 1 : 0.25} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Registre d'activité — un seul bandeau divisé par des filets, pas cinq
 * tuiles de couleur pleine avec vignette décorative : les chiffres du jour
 * se lisent comme une ligne d'écritures, pas comme cinq publicités
 * indépendantes. Chaque flux comparable mois/mois porte son propre
 * historique en mini-graphique plutôt qu'un simple pourcentage isolé.
 */
export function DashboardStatStrip({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y divide-border/60 sm:divide-y-0 sm:divide-x">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const Tag = stat.onClick ? "button" : "div";
          return (
            <Tag
              key={stat.key}
              type={stat.onClick ? "button" : undefined}
              onClick={stat.onClick}
              className={cn(
                "flex items-start justify-between gap-3 px-4 py-4 sm:px-5 text-left transition-colors",
                stat.onClick && "cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted/60",
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  <p className="text-xs">{stat.label}</p>
                </div>
                <p className="mt-1 font-mono text-xl font-bold tabular-nums leading-tight text-foreground sm:text-2xl">
                  {typeof stat.value === "number" ? stat.value.toLocaleString("fr-FR") : stat.value}
                </p>
                {stat.trend !== undefined && (
                  <p
                    className={cn(
                      "mt-1 text-[11px] font-semibold tabular-nums",
                      stat.trend < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {stat.trend < 0 ? "↓" : "↑"} {stat.trend > 0 ? `+${stat.trend}` : stat.trend}%
                  </p>
                )}
              </div>
              {stat.series && stat.series.some((v) => v > 0) && (
                <Sparkbar series={stat.series} trend={stat.trend} />
              )}
            </Tag>
          );
        })}
      </div>
    </div>
  );
}

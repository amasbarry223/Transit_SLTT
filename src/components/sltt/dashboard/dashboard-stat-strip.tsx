"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export interface DashboardStat {
  key: string;
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Variation réelle (%) vs le mois précédent — omise pour un état
   *  instantané (ex. "en cours") qui n'a pas de sens comparé mois/mois. */
  trend?: number;
  onClick?: () => void;
}

/**
 * Registre d'activité — un seul bandeau divisé par des filets, pas cinq
 * tuiles de couleur pleine avec vignette décorative : les chiffres du jour
 * se lisent comme une ligne d'écritures, pas comme cinq publicités
 * indépendantes. Le seul accent de couleur est la variation (rouge/vert),
 * jamais un fond.
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
                "flex items-start gap-3 px-4 py-4 sm:px-5 text-left transition-colors",
                stat.onClick && "cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted/60",
              )}
            >
              <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-0.5 font-mono text-xl font-bold tabular-nums leading-tight text-foreground sm:text-2xl">
                  {typeof stat.value === "number" ? stat.value.toLocaleString("fr-FR") : stat.value}
                </p>
                {stat.trend !== undefined && (
                  <p
                    className={cn(
                      "mt-1 text-[11px] font-semibold tabular-nums",
                      stat.trend < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {stat.trend < 0 ? "↓" : "↑"} {stat.trend > 0 ? `+${stat.trend}` : stat.trend}% ce mois
                  </p>
                )}
              </div>
            </Tag>
          );
        })}
      </div>
    </div>
  );
}

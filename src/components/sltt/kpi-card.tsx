"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

type KpiTone = "blue" | "emerald" | "amber" | "red" | "indigo";

const iconWrap: Record<KpiTone, string> = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  indigo: "bg-indigo-50 text-indigo-600",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "blue",
  variation,
  variationLabel,
  sublabel,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: KpiTone;
  variation?: number;
  variationLabel?: string;
  sublabel?: string;
}) {
  return (
    <Card className="p-5 gap-0 shadow-sm border-border/80">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500 font-medium truncate">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            iconWrap[tone],
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
      {(variation !== undefined || sublabel) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {variation !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded-md",
                variation >= 0
                  ? "text-emerald-700 bg-emerald-50"
                  : "text-red-700 bg-red-50",
              )}
            >
              {variation >= 0 ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {variation >= 0 ? "+" : ""}
              {variation}%
            </span>
          )}
          {variationLabel && (
            <span className="text-slate-400">{variationLabel}</span>
          )}
          {!variationLabel && sublabel && (
            <span className="text-slate-400">{sublabel}</span>
          )}
        </div>
      )}
    </Card>
  );
}

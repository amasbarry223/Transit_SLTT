"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type KpiTone = "blue" | "emerald" | "amber" | "red" | "indigo" | "violet";

const toneStyles: Record<
  KpiTone,
  {
    bg: string;
    shadow: string;
  }
> = {
  blue: {
    bg: "bg-[#1344C8]",
    shadow: "shadow-[#1344C8]/25",
  },
  indigo: {
    bg: "bg-[#2563EB]",
    shadow: "shadow-[#2563EB]/25",
  },
  violet: {
    bg: "bg-[#1D4ED8]",
    shadow: "shadow-[#1D4ED8]/25",
  },
  amber: {
    bg: "bg-[#0B38A8]",
    shadow: "shadow-[#0B38A8]/25",
  },
  red: {
    bg: "bg-[#ED1C24]",
    shadow: "shadow-[#ED1C24]/25",
  },
  emerald: {
    bg: "bg-[#059669]",
    shadow: "shadow-[#059669]/25",
  },
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "blue",
  variation,
  variationLabel,
  sublabel,
  tooltip,
  compact = false,
  valueNegative = false,
  className,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: KpiTone;
  variation?: number;
  variationLabel?: string;
  sublabel?: string;
  tooltip?: string;
  /** Affiche la valeur en rouge (ex. bénéfice négatif) */
  valueNegative?: boolean;
  /** Grille dense */
  compact?: boolean;
  className?: string;
}) {
  const conf = toneStyles[tone] || toneStyles.blue;

  if (compact) {
    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl p-4 text-white shadow-md transition-all duration-200",
          conf.bg,
          conf.shadow,
          "hover:-translate-y-0.5 hover:shadow-lg",
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-xs">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-white/85">{label}</p>
            <p className="truncate text-base font-black tabular-nums text-white">{value}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex h-full min-h-[7.5rem] flex-col justify-between overflow-hidden rounded-2xl p-5 text-white shadow-lg transition-all duration-200 select-none",
        conf.bg,
        conf.shadow,
        "hover:-translate-y-1 hover:shadow-xl",
        className,
      )}
    >
      {/* Wave SVG in bottom right matching reference image */}
      <svg
        className="pointer-events-none absolute -bottom-1 -right-2 h-20 w-36 opacity-35 transition-all duration-300 group-hover:scale-105 group-hover:opacity-50"
        viewBox="0 0 140 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M0 44 C28 40, 48 14, 78 24 C104 33, 118 8, 140 16"
          stroke="rgba(255, 255, 255, 0.75)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="140" cy="16" r="3.5" fill="rgba(255, 255, 255, 0.9)" />
      </svg>

      {/* Top row: Icon + Label */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-xs transition-transform duration-200 group-hover:scale-105">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1 flex items-center gap-1.5">
          <span className="text-xs sm:text-[13px] font-medium text-white/95 truncate">
            {label}
          </span>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex shrink-0 text-white/70 hover:text-white transition-colors"
                    aria-label={`Aide : ${label}`}
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Main value */}
      <div className="mt-3">
        <p
          className={cn(
            "text-2xl sm:text-3xl font-black tracking-tight text-white tabular-nums",
            valueNegative && "text-red-200",
          )}
        >
          {value}
        </p>
      </div>

      {/* Sublabel or variation */}
      {(variation !== undefined || sublabel) && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs">
          {variation !== undefined ? (
            <>
              <span className="inline-flex items-center gap-0.5 font-bold text-emerald-300">
                {variation >= 0 ? (
                  <TrendingUp className="size-3.5" />
                ) : (
                  <TrendingDown className="size-3.5" />
                )}
                <span>{variation > 0 ? `+${variation}%` : `${variation}%`}</span>
              </span>
              {variationLabel && (
                <span className="text-white/75 font-normal truncate">
                  {variationLabel}
                </span>
              )}
            </>
          ) : (
            <span className="text-white/80 text-[11px] truncate">
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

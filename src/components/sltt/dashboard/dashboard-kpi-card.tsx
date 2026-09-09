"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";
import type { LucideIcon } from "lucide-react";

export type DashboardKpiVariant = "royal" | "blue" | "red" | "navy" | "emerald";

interface DashboardKpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: DashboardKpiVariant;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  sublabel?: string;
  onClick?: () => void;
  className?: string;
}

const variantStyles: Record<
  DashboardKpiVariant,
  {
    bg: string;
    shadow: string;
  }
> = {
  royal: {
    bg: "bg-[#1344C8]",
    shadow: "shadow-[#1344C8]/25",
  },
  blue: {
    bg: "bg-[#2563EB]",
    shadow: "shadow-[#2563EB]/25",
  },
  red: {
    bg: "bg-[#ED1C24]",
    shadow: "shadow-[#ED1C24]/25",
  },
  navy: {
    bg: "bg-[#0B38A8]",
    shadow: "shadow-[#0B38A8]/25",
  },
  emerald: {
    bg: "bg-[#059669]",
    shadow: "shadow-[#059669]/25",
  },
};

export function DashboardKpiCard({
  label,
  value,
  icon: Icon,
  variant = "royal",
  trend,
  sublabel,
  onClick,
  className,
}: DashboardKpiCardProps) {
  const conf = variantStyles[variant] || variantStyles.royal;

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "group relative overflow-hidden rounded-2xl p-5 text-white shadow-lg transition-all duration-200 select-none",
        conf.bg,
        conf.shadow,
        onClick && "cursor-pointer hover:-translate-y-1 hover:shadow-xl active:translate-y-0",
        className,
      )}
    >
      {/* Decorative smooth white wave line in bottom right matching reference */}
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
        <span className="text-xs sm:text-[13px] font-medium text-white/95 truncate">
          {label}
        </span>
      </div>

      {/* Main value */}
      <div className="mt-3">
        <p className="text-3xl font-black tracking-tight text-white tabular-nums">
          {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
        </p>
      </div>

      {/* Trend or sublabel */}
      {(trend !== undefined || sublabel) && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs">
          {trend !== undefined ? (
            <>
              <span className="inline-flex items-center gap-0.5 font-bold text-emerald-300">
                <span>↗</span>
                <span>{trend.value > 0 ? `+${trend.value}%` : `${trend.value}%`}</span>
              </span>
              <span className="text-white/75 font-normal">
                {trend.label ?? "vs mois dernier"}
              </span>
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

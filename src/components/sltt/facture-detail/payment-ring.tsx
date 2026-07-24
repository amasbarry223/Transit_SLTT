"use client";

import { cn } from "@/lib/utils";
import { formatFCFA } from "@/lib/format";
import { PAYMENT_RING_RADIUS_PX } from "@/lib/constants";

export function PaymentRing({ pct, reste, isEchue }: { pct: number; reste: number; isEchue: boolean }) {
  const ringRadiusPx = PAYMENT_RING_RADIUS_PX;
  const circ = 2 * Math.PI * ringRadiusPx;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-20 shrink-0">
        <svg className="-rotate-90 size-20" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={ringRadiusPx} fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-slate-800" />
          <circle
            cx="40"
            cy="40"
            r={ringRadiusPx}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className={cn(
              "transition-all duration-500",
              pct >= 100 ? "text-emerald-500" : isEchue ? "text-red-500" : "text-blue-600",
            )}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-extrabold tabular-nums text-slate-900 dark:text-slate-100">{pct}%</span>
          <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">payé</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">Reste à payer</p>
        <p
          className={cn(
            "mt-0.5 text-xl font-extrabold tabular-nums leading-tight",
            reste === 0 ? "text-emerald-600" : isEchue ? "text-red-600" : "text-amber-700",
          )}
        >
          {formatFCFA(reste)}
        </p>
      </div>
    </div>
  );
}

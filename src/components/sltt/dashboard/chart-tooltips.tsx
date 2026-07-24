"use client";

import { formatFCFA } from "@/lib/format";

export type ChartTooltipPayload = {
  name?: string | number;
  value?: number;
  payload?: Record<string, unknown>;
};

export function EncaissementsTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ChartTooltipPayload[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const valeur = item?.value ?? 0;
  const mois = (item?.payload as { mois?: string })?.mois ?? "";
  return (
    <div className="rounded-lg border border-border bg-white dark:bg-slate-800 p-3 text-sm shadow-md">
      <p className="font-medium text-slate-900 dark:text-slate-100">{mois}</p>
      <p className="mt-0.5 tabular-nums text-slate-600 dark:text-slate-300">{formatFCFA(valeur)}</p>
    </div>
  );
}

export function EcartsTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ChartTooltipPayload[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const ecart = item?.value ?? 0;
  const isPositive = ecart >= 0;
  const periode = (item?.payload as { periode?: string })?.periode ?? "";
  return (
    <div className="rounded-lg border border-border bg-white dark:bg-slate-800 p-3 text-sm shadow-md">
      <p className="font-medium text-slate-900 dark:text-slate-100">{periode}</p>
      <p className={"mt-0.5 tabular-nums font-medium " + (isPositive ? "text-emerald-600" : "text-red-600")}>
        {isPositive ? "+" : ""}{formatFCFA(ecart)}
      </p>
    </div>
  );
}

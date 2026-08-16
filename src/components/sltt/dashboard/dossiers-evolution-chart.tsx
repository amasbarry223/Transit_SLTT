"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import { SLTT_BLUE } from "@/lib/constants";
import { Card } from "@/components/ui/card";

export function DossiersEvolutionChart({
  data,
  gridColor,
  tickColor,
  barCursorFill,
}: {
  data: { mois: string; valeur: number }[];
  gridColor: string;
  tickColor: string;
  barCursorFill: string;
}) {
  const hasData = data.some((d) => d.valeur !== 0);

  return (
    <Card className="rounded-xl border-border/80 p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Évolution des dossiers
          </h2>
          <p className="text-xs text-muted-foreground">6 derniers mois</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block size-2.5 rounded-sm" style={{ background: SLTT_BLUE }} />
          Dossiers créés
        </div>
      </div>
      {!hasData ? (
        <div className="flex h-[280px] flex-col items-center justify-center gap-1 text-center">
          <BarChart3 className="size-7 text-muted-foreground/70" />
          <p className="text-sm text-muted-foreground">Aucun dossier sur cette période.</p>
        </div>
      ) : (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: tickColor }}
                axisLine={false}
                tickLine={false}
                width={32}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(value: number) => [`${value} dossier${value !== 1 ? "s" : ""}`, "Créés"]}
                cursor={{ fill: barCursorFill, fillOpacity: 0.7 }}
              />
              <Bar dataKey="valeur" fill={SLTT_BLUE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

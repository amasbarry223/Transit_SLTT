"use client";

import { ArrowRight, FolderKanban, Plus } from "lucide-react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "@/lib/store";
import { useUiPrefs } from "@/lib/session/ui-prefs-store";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";

// Mêmes teintes que DOSSIER_STATUT_TONE (status-badge.tsx) — le pipeline
// utilise le même code couleur que le badge de statut affiché partout
// ailleurs sur un dossier, pas une palette de graphique indépendante.
const STAGE_COLORS: Record<string, string> = {
  "En cours": "#2563EB",
  "Dédouané": "#6366F1",
  "Livré": "#F59E0B",
  "Soldé": "#059669",
};

export function AgentPanel({
  go,
  openDossier,
}: {
  go: (v: "dossiers" | "devis", opts?: { id?: string | null }) => void;
  openDossier: (id: string | null, mode?: "create" | "edit") => void;
}) {
  const dossiers = useStore((s) => s.dossiers);
  const isDark = useUiPrefs((s) => s.theme) === "dark";
  const tickColor = isDark ? "#92A3BA" : "#64748B";
  const pipeline: Record<string, number> = { "En cours": 0, "Dédouané": 0, "Livré": 0, "Soldé": 0 };
  for (const d of dossiers) pipeline[d.statut] = (pipeline[d.statut] ?? 0) + 1;

  const data = ["En cours", "Dédouané", "Livré", "Soldé"].map((label) => ({
    label,
    count: pipeline[label] ?? 0,
  }));
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  return (
    <Card className="border-border/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Pipeline dossiers</h2>
          <p className="text-xs text-muted-foreground">État de votre portefeuille</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => go("dossiers")}>
            Voir tout <ArrowRight className="ml-1 size-3.5" />
          </Button>
          <Button size="sm" onClick={() => openDossier(null, "create")}>
            <Plus className="mr-1 size-3.5" /> Nouveau dossier
          </Button>
        </div>
      </div>
      {dossiers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 py-6 text-center">
          <FolderKanban className="size-7" />
          <p className="text-sm text-muted-foreground">Aucun dossier pour l'instant.</p>
          <p className="text-xs text-muted-foreground">Créez un devis ou un dossier pour démarrer.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={4 * 36}>
          <BarChart
            data={data}
            layout="vertical"
            barSize={16}
            margin={{ top: 0, right: 28, bottom: 0, left: 0 }}
          >
            <XAxis type="number" domain={[0, maxCount]} hide />
            <YAxis
              type="category"
              dataKey="label"
              width={72}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: tickColor, fontWeight: 500 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as { label: string; count: number };
                return (
                  <div className="rounded-lg border border-border bg-popover/95 px-3 py-1.5 text-xs shadow-lg">
                    <span className="font-semibold text-foreground">{p.label}</span>
                    <span className="ml-2 tabular-nums text-muted-foreground">{p.count} dossier{p.count !== 1 ? "s" : ""}</span>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.label} fill={STAGE_COLORS[d.label]} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                className="fill-foreground text-xs font-bold tabular-nums"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

"use client";

import { ArrowRight, FolderKanban, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AgentPanel({
  go,
  openDossier,
}: {
  go: (v: "dossiers" | "devis", opts?: { id?: string | null }) => void;
  openDossier: (id: string | null, mode?: "create" | "edit") => void;
}) {
  const dossiers = useStore((s) => s.dossiers);
  const pipeline: Record<string, number> = { "En cours": 0, "Dédouané": 0, "Livré": 0, "Soldé": 0 };
  for (const d of dossiers) pipeline[d.statut] = (pipeline[d.statut] ?? 0) + 1;

  const steps = [
    { label: "En cours",  count: pipeline["En cours"],  color: "bg-blue-500",    bg: "bg-blue-50 dark:bg-blue-950/40",    text: "text-blue-700 dark:text-blue-400"  },
    { label: "Dédouané",  count: pipeline["Dédouané"],  color: "bg-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-950/40",  text: "text-indigo-700 dark:text-indigo-400"},
    { label: "Livré",     count: pipeline["Livré"],     color: "bg-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/40",   text: "text-amber-700 dark:text-amber-400" },
    { label: "Soldé",     count: pipeline["Soldé"],     color: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400"},
  ];

  return (
    <Card className="border-border/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Pipeline dossiers</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">État de votre portefeuille</p>
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
          <FolderKanban className="size-7 text-slate-200 dark:text-slate-700" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Aucun dossier pour l'instant.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Créez un devis ou un dossier pour démarrer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {steps.map((s) => (
            <div key={s.label} className={`rounded-xl p-4 text-center ${s.bg}`}>
              <p className={`text-2xl font-bold tabular-nums ${s.text}`}>{s.count}</p>
              <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">{s.label}</p>
              <div className={`mx-auto mt-2 h-1 w-8 rounded-full ${s.color}`} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

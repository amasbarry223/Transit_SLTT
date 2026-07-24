"use client";

import { ArrowRight, CheckCircle2, FileOutput, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { resteAPayer } from "@/lib/domain-types";
import { formatFCFA } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ComptablePanel({ go }: { go: (v: "comptabilite" | "bilans" | "factures", opts?: { id?: string | null }) => void }) {
  const ecritures = useStore((s) => s.ecritures);
  const factures = useStore((s) => s.factures);
  const dossiers = useStore((s) => s.dossiers);
  const totalDu = dossiers.reduce((s, d) => s + resteAPayer(d), 0);
  const nbImpayés = dossiers.filter((d) => resteAPayer(d) > 0).length;
  const dernières = [...ecritures]
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .slice(0, 5);

  const facturesImpayées = factures.filter((f) => f.statut !== "Soldée" && f.statut !== "Annulée");
  const totalFactures = facturesImpayées.reduce(
    (s, f) => s + resteAPayer({ montantInvesti: f.montantTTC, montantPaye: f.montantPaye }),
    0,
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <Card className="border-border/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Créances en cours</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{nbImpayés} dossier{nbImpayés !== 1 ? "s" : ""} non soldé{nbImpayés !== 1 ? "s" : ""} · {formatFCFA(totalDu)} restants</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => go("comptabilite")}>
            Comptabilité <ArrowRight className="ml-1 size-3.5" />
          </Button>
          <Button size="sm" onClick={() => go("comptabilite", { id: "new" })}>
            <Plus className="mr-1 size-3.5" /> Nouvelle écriture
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {dernières.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">Aucune écriture enregistrée.</p>
        ) : dernières.map((e) => (
          <div key={e.id} className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2.5">
            <div className={`size-2 shrink-0 rounded-full ${e.montantPaye >= e.montantInvesti ? "bg-emerald-500" : "bg-amber-400"}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{e.clientNom}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{e.date}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatFCFA(e.montantPaye)}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">/ {formatFCFA(e.montantInvesti)}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>

    <Card className="border-border/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Factures en attente</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{facturesImpayées.length} facture{facturesImpayées.length !== 1 ? "s" : ""} · {formatFCFA(totalFactures)} restants</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => go("factures")}>
          Factures <ArrowRight className="ml-1 size-3.5" />
        </Button>
      </div>
      <div className="space-y-2">
        {facturesImpayées.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="size-7 text-emerald-300" />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Aucune facture en attente</p>
          </div>
        ) : facturesImpayées.slice(0, 5).map((f) => (
          <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <FileOutput className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{f.numero} · {f.clientNom}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{f.statut}</p>
            </div>
            <span className="text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {formatFCFA(resteAPayer({ montantInvesti: f.montantTTC, montantPaye: f.montantPaye }))}
            </span>
          </div>
        ))}
      </div>
    </Card>
    </div>
  );
}

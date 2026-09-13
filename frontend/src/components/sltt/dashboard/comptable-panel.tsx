"use client";

import { useMemo } from "react";
import { ArrowRight, CheckCircle2, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { resteAPayer } from "@/lib/domain-types";
import { dossiersNonFactures } from "@/lib/client-stats";
import { formatFCFA } from "@/lib/format";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";

/** Barre proportionnelle payé/total — remplace une ligne de deux montants
 *  bruts par la vraie donnée qui compte ici : quelle part est réglée. */
function AmountProgressBar({
  label,
  sublabel,
  paye,
  total,
  className,
}: {
  label: string;
  sublabel: string;
  paye: number;
  total: number;
  className?: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((paye / total) * 100)) : 0;
  const solde = total > 0 && paye >= total;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-foreground">{label}</p>
          <p className="truncate text-[11px] text-muted-foreground">{sublabel}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-semibold tabular-nums text-foreground">{formatFCFA(paye)}</p>
          <p className="text-[10px] tabular-nums text-muted-foreground">/ {formatFCFA(total)}</p>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", solde ? "bg-emerald-500" : "bg-amber-400")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ComptablePanel({ go }: { go: (v: "comptabilite" | "bilans" | "factures", opts?: { id?: string | null }) => void }) {
  const ecritures = useStore((s) => s.ecritures);
  const factures = useStore((s) => s.factures);
  const dossiers = useStore((s) => s.dossiers);

  // Un dossier déjà facturé (compté à droite, dans "Factures en attente")
  // n'est plus la source de vérité de son reste dû : sans cette exclusion,
  // la même créance apparaissait deux fois — une fois ici avec le reste
  // obsolète du dossier, une fois à droite avec le vrai reste de sa facture.
  const dossiersSansFacture = useMemo(() => dossiersNonFactures(dossiers, factures), [dossiers, factures]);
  const totalDu = useMemo(
    () => dossiersSansFacture.reduce((sum, d) => sum + resteAPayer(d), 0),
    [dossiersSansFacture],
  );
  const nbImpayés = useMemo(
    () => dossiersSansFacture.filter((d) => resteAPayer(d) > 0).length,
    [dossiersSansFacture],
  );
  const dernières = useMemo(
    () => [...ecritures].sort((a, b) => (a.date > b.date ? -1 : 1)).slice(0, 5),
    [ecritures],
  );

  const facturesImpayées = useMemo(
    () => factures.filter((f) => f.statut !== "Soldée" && f.statut !== "Annulée"),
    [factures],
  );
  const totalFactures = useMemo(
    () =>
      facturesImpayées.reduce(
        (sum, f) => sum + resteAPayer({ montantInvesti: f.montantTTC, montantPaye: f.montantPaye }),
        0,
      ),
    [facturesImpayées],
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <Card className="border-border/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Créances en cours</h2>
          <p className="text-xs text-muted-foreground">{nbImpayés} dossier{nbImpayés !== 1 ? "s" : ""} non soldé{nbImpayés !== 1 ? "s" : ""} · {formatFCFA(totalDu)} restants</p>
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
      <div className="space-y-3.5">
        {dernières.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">Aucune écriture enregistrée.</p>
        ) : dernières.map((e) => (
          <AmountProgressBar
            key={e.id}
            label={e.clientNom}
            sublabel={e.date}
            paye={e.montantPaye}
            total={e.montantInvesti}
          />
        ))}
      </div>
    </Card>

    <Card className="border-border/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Factures en attente</h2>
          <p className="text-xs text-muted-foreground">{facturesImpayées.length} facture{facturesImpayées.length !== 1 ? "s" : ""} · {formatFCFA(totalFactures)} restants</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => go("factures")}>
          Factures <ArrowRight className="ml-1 size-3.5" />
        </Button>
      </div>
      <div className="space-y-3.5">
        {facturesImpayées.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="size-7 text-emerald-300" />
            <p className="mt-2 text-sm text-muted-foreground">Aucune facture en attente</p>
          </div>
        ) : facturesImpayées.slice(0, 5).map((f) => (
          <AmountProgressBar
            key={f.id}
            label={`${f.numero} · ${f.clientNom}`}
            sublabel={f.statut}
            paye={f.montantPaye}
            total={f.montantTTC}
          />
        ))}
      </div>
    </Card>
    </div>
  );
}

import { TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/sltt/kpi-card";
import { formatFCFA } from "@/lib/format";
import type { Societe } from "@/lib/domain-types";

interface Benefice {
  benefice: number;
}

interface BeneficeParSociete {
  societe: Societe;
  benefice: number;
}

interface BeneficeKpiRowProps {
  resolvedTab: string;
  societesCount: number;
  consolide: Benefice;
  parSociete: BeneficeParSociete[];
}

export function BeneficeKpiRow({
  resolvedTab,
  societesCount,
  consolide,
  parSociete,
}: BeneficeKpiRowProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Bénéfice du mois (entreposage)</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {resolvedTab === "all" && (
          <KpiCard
            label="Toutes sociétés"
            value={formatFCFA(consolide.benefice)}
            icon={TrendingUp}
            tone={consolide.benefice >= 0 ? "emerald" : "red"}
            sublabel="Recettes − Dépenses, consolidé"
            tooltip={`Recettes = encaissements (écritures + paiements factures) du mois. Dépenses = dépenses de contrats du mois. Consolidé = somme de toutes les sociétés (${societesCount}) + activité non affectée.`}
          />
        )}
        {parSociete
          .filter(({ societe }) => resolvedTab === "all" || societe.id === resolvedTab)
          .map(({ societe, benefice }) => (
            <KpiCard
              key={societe.id}
              label={societe.nom}
              value={formatFCFA(benefice)}
              icon={TrendingUp}
              tone={benefice >= 0 ? "emerald" : "red"}
              sublabel="bénéfice du mois"
            />
          ))}
      </div>
    </div>
  );
}

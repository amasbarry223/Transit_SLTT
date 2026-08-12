import { ArrowDownCircle, ArrowUpCircle, Scale } from "lucide-react";
import { KpiCard } from "@/components/sltt/kpi-card";
import { formatFCFA } from "@/lib/format";

interface OperationsKpiRowProps {
  totalEntree: number;
  totalSortie: number;
  soldeTheorique: number;
}

export function OperationsKpiRow({ totalEntree, totalSortie, soldeTheorique }: OperationsKpiRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KpiCard label="Total entrées" value={formatFCFA(totalEntree)} icon={ArrowDownCircle} tone="emerald" sublabel="sur la période affichée" />
      <KpiCard label="Total sorties" value={formatFCFA(totalSortie)} icon={ArrowUpCircle} tone="amber" sublabel="sur la période affichée" />
      <KpiCard
        label="Écart"
        value={formatFCFA(soldeTheorique)}
        icon={Scale}
        tone={soldeTheorique >= 0 ? "blue" : "red"}
        sublabel="entrées − sorties, calculé automatiquement"
      />
    </div>
  );
}

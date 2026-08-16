import { Clock, TrendingUp, Wallet } from "lucide-react";
import { KpiCard } from "@/components/sltt/kpi-card";
import { formatFCFA } from "@/lib/format";

interface EcrituresKpiRowProps {
  totalInvesti: number;
  totalPaye: number;
  totalDu: number;
  enAttenteCount: number;
}

export function EcrituresKpiRow({
  totalInvesti,
  totalPaye,
  totalDu,
  enAttenteCount,
}: EcrituresKpiRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KpiCard label="Total investi" value={formatFCFA(totalInvesti)} icon={TrendingUp} tone="blue" sublabel="cumul des écritures" />
      <KpiCard label="Total encaissé" value={formatFCFA(totalPaye)} icon={Wallet} tone="emerald" sublabel="paiements reçus" />
      <KpiCard
        label="Total dû"
        value={formatFCFA(totalDu)}
        icon={Clock}
        tone="amber"
        sublabel={`${enAttenteCount} écriture${enAttenteCount !== 1 ? "s" : ""} en attente`}
      />
    </div>
  );
}

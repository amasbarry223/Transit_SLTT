import { Clock } from "lucide-react";
import { formatFCFA } from "@/lib/format";

interface PendingAlertBannerProps {
  count: number;
  totalDu: number;
}

export function PendingAlertBanner({ count, totalDu }: PendingAlertBannerProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 dark:border-amber-900/60 dark:bg-amber-950/30">
      <Clock className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div>
        <p className="text-sm font-medium text-amber-900 dark:text-amber-400">
          {count} écriture{count > 1 ? "s" : ""} en attente de paiement
        </p>
        <p className="mt-0.5 text-xs text-amber-800/80 dark:text-amber-400/80">
          {formatFCFA(totalDu)} reste à encaisser au total.
        </p>
      </div>
    </div>
  );
}

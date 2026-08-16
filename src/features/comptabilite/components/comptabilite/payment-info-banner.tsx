import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentInfoBannerProps {
  onOpenFactures: () => void;
}

export function PaymentInfoBanner({ onOpenFactures }: PaymentInfoBannerProps) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
      <Info className="mt-0.5 size-4 shrink-0 text-blue-500" />
      <p>
        <strong>Où enregistrer un paiement ?</strong> Dossier transit → transition « Soldé » sur la fiche dossier ;
        facture client → module{" "}
        <Button variant="link" className="h-auto p-0 font-semibold" onClick={onOpenFactures}>
          Factures
        </Button>
        ; paiement autonome sans dossier → écriture ici. Les trois canaux sont indépendants.
      </p>
    </div>
  );
}

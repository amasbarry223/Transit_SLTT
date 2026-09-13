"use client";

import type { RecuPaiementModuleData } from "@/lib/export";
import { fmtDate, fmtFCFA } from "@/lib/export/print-modules/shared";
import { montantEnLettresFCFA } from "@/lib/number-to-words-fr";
import { RECEIPT_BLUE, RECEIPT_SIG_HEIGHT_MM, RECEIPT_SIG_WIDTH_MM } from "@/lib/recus-paiement-styles";
import { cn } from "@/shared/utils/cn";

interface RecuReceiptBodyProps {
  data: RecuPaiementModuleData;
  className?: string;
}

function FieldLine({ label, value, className }: { label: string; value?: string; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-1 items-baseline gap-0.5", className)}>
      <span className="shrink-0 text-[9px] font-semibold whitespace-nowrap" style={{ color: RECEIPT_BLUE }}>
        {label}
      </span>
      <span
        className="min-h-[12px] flex-1 overflow-hidden border-b pb-px text-[9px] font-medium text-ellipsis whitespace-nowrap"
        style={{ borderColor: RECEIPT_BLUE, color: RECEIPT_BLUE }}
      >
        {value || "\u00a0"}
      </span>
    </div>
  );
}

/** Corps du reçu paysage — champs en lignes horizontales comme le carnet papier. */
export function RecuReceiptBody({ data, className }: RecuReceiptBodyProps) {
  // Reçu vierge : "0 FCFA" ou une date invalide sur un carnet à remplir au
  // stylo serait pire qu'une ligne blanche — on ne formate que le réel.
  const sommeLettres = data.somme ? montantEnLettresFCFA(data.somme) : "";
  const montantPayeAffiche = data.montantPaye ? fmtFCFA(data.montantPaye) : undefined;
  const resteAffiche = data.reste ? fmtFCFA(data.reste) : undefined;
  const dateAffichee = data.date ? fmtDate(data.date) : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5 text-[9px]", className)} style={{ color: RECEIPT_BLUE }}>
      <div className="flex gap-3">
        <FieldLine label="Nom :" value={data.nom} />
        <FieldLine label="Prénom :" value={data.prenom} />
      </div>

      <div className="flex items-baseline gap-0.5">
        <span className="shrink-0 text-[9px] font-semibold whitespace-nowrap">la somme de :</span>
        <span
          className="min-h-[12px] flex-1 border-b pb-px text-[9px] font-medium"
          style={{ borderColor: RECEIPT_BLUE }}
        >
          {sommeLettres || "\u00a0"}
        </span>
      </div>

      <FieldLine label="Motif :" value={data.motif} className="w-full flex-none [&_span:last-child]:whitespace-normal" />

      <div className="flex gap-4">
        <FieldLine label="Montant payé :" value={montantPayeAffiche} />
        <FieldLine label="Reste :" value={resteAffiche} />
      </div>

      <div className="mt-0.5 flex items-end justify-between gap-3">
        <FieldLine label="Date, le" value={dateAffichee} className="max-w-[55%] flex-none" />
        <div
          className="flex shrink-0 items-end justify-center rounded-md border-[1.5px] p-1"
          style={{
            borderColor: RECEIPT_BLUE,
            width: `${RECEIPT_SIG_WIDTH_MM}mm`,
            height: `${RECEIPT_SIG_HEIGHT_MM}mm`,
          }}
        >
          {data.signature ? (
            <img src={data.signature} alt="Signature" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-[8px] font-bold">Signature</span>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import type { RecuPaiementModuleData } from "@/lib/export";
import { fmtDate, fmtFCFA } from "@/lib/export/print-modules/shared";
import { montantEnLettresFCFA } from "@/lib/number-to-words-fr";
import { RECEIPT_BLUE } from "@/lib/recus-paiement-styles";
import { cn } from "@/lib/utils";

interface RecuReceiptBodyProps {
  data: RecuPaiementModuleData;
  className?: string;
}

function FieldLine({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-1 items-baseline gap-1", className)}>
      <span className="shrink-0 text-[10px] font-semibold whitespace-nowrap" style={{ color: RECEIPT_BLUE }}>
        {label}
      </span>
      <span
        className="min-h-[14px] flex-1 overflow-hidden border-b pb-0.5 text-[10px] font-medium text-ellipsis whitespace-nowrap"
        style={{ borderColor: RECEIPT_BLUE, color: RECEIPT_BLUE }}
      >
        {value || "\u00a0"}
      </span>
    </div>
  );
}

/** Corps du reçu paysage — champs en lignes horizontales comme le carnet papier. */
export function RecuReceiptBody({ data, className }: RecuReceiptBodyProps) {
  const sommeLettres = montantEnLettresFCFA(data.somme);

  return (
    <div className={cn("flex flex-col gap-2 text-[10px]", className)} style={{ color: RECEIPT_BLUE }}>
      <div className="flex gap-4">
        <FieldLine label="Nom :" value={data.nom} />
        <FieldLine label="Prénom :" value={data.prenom} />
      </div>

      <div className="flex items-baseline gap-1">
        <span className="shrink-0 text-[10px] font-semibold whitespace-nowrap">la somme de :</span>
        <span
          className="min-h-[14px] flex-1 border-b pb-0.5 text-[10px] font-medium"
          style={{ borderColor: RECEIPT_BLUE }}
        >
          {sommeLettres || "\u00a0"}
        </span>
      </div>

      <FieldLine label="Motif :" value={data.motif} className="w-full flex-none [&_span:last-child]:whitespace-normal" />

      <div className="flex gap-6">
        <FieldLine label="Montant payé :" value={fmtFCFA(data.montantPaye)} />
        <FieldLine label="Reste :" value={fmtFCFA(data.reste)} />
      </div>

      <div className="mt-1 flex items-end justify-between gap-4">
        <FieldLine label="Date, le" value={fmtDate(data.date)} className="max-w-[55%] flex-none" />
        <div
          className="flex h-[18mm] w-[38mm] shrink-0 items-end justify-center rounded-lg border-[1.5px] p-1.5"
          style={{ borderColor: RECEIPT_BLUE }}
        >
          {data.signature ? (
            <img src={data.signature} alt="Signature" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-[9px] font-bold">Signature</span>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import type { RecuPaiementModuleData } from "@/lib/export";
import { fmtDate, fmtFCFA } from "@/lib/export/print-modules/shared";
import { montantEnLettresFCFA } from "@/lib/number-to-words-fr";
import { RECEIPT_BLUE, RECEIPT_SIG_HEIGHT_MM, RECEIPT_SIG_WIDTH_MM } from "@/lib/recus-paiement-styles";
import { cn } from "@/shared/utils/cn";

export type RecuEditableField = "nom" | "prenom" | "motif" | "somme" | "montantPaye";

export interface RecuReceiptBodyProps {
  data: RecuPaiementModuleData;
  className?: string;
  editable?: boolean;
  onFieldChange?: (field: RecuEditableField, value: string) => void;
  /** Saisie brute du montant payé : dériver la valeur de `data.montantPaye`
   *  (nombre) avalerait les décimales en cours de frappe ("1." → "1"). */
  montantPayeInput?: string;
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

/** Corps du reçu paysage — champs en lignes horizontales avec possibilité de saisie interactive directe. */
export function RecuReceiptBody({
  data,
  className,
  editable = false,
  onFieldChange,
  montantPayeInput,
}: RecuReceiptBodyProps) {
  const sommeLettres = data.somme ? montantEnLettresFCFA(data.somme) : "";
  const montantPayeAffiche = data.montantPaye ? fmtFCFA(data.montantPaye) : undefined;
  const resteAffiche = data.reste ? fmtFCFA(data.reste) : undefined;
  const dateAffichee = data.date ? fmtDate(data.date) : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5 text-[9px]", className)} style={{ color: RECEIPT_BLUE }}>
      {/* Nom & Prénom */}
      <div className="flex gap-3">
        {editable ? (
          <div className="flex min-w-0 flex-1 items-baseline gap-1">
            <span className="shrink-0 text-[9px] font-semibold whitespace-nowrap" style={{ color: RECEIPT_BLUE }}>
              Nom :
            </span>
            <input
              type="text"
              value={data.nom || ""}
              onChange={(e) => onFieldChange?.("nom", e.target.value)}
              placeholder="Cliquez pour saisir le nom..."
              className="min-h-[13px] flex-1 border-b border-dashed border-[#1e4a8a]/40 pb-px text-[9px] font-medium bg-transparent outline-none focus:border-solid focus:border-[#1e4a8a] focus:bg-blue-50/40 dark:focus:bg-blue-950/20 px-0.5 transition-colors placeholder:text-[#1e4a8a]/35 placeholder:text-[8px]"
              style={{ color: RECEIPT_BLUE }}
            />
          </div>
        ) : (
          <FieldLine label="Nom :" value={data.nom} />
        )}

        {editable ? (
          <div className="flex min-w-0 flex-1 items-baseline gap-1">
            <span className="shrink-0 text-[9px] font-semibold whitespace-nowrap" style={{ color: RECEIPT_BLUE }}>
              Prénom :
            </span>
            <input
              type="text"
              value={data.prenom || ""}
              onChange={(e) => onFieldChange?.("prenom", e.target.value)}
              placeholder="Prénom..."
              className="min-h-[13px] flex-1 border-b border-dashed border-[#1e4a8a]/40 pb-px text-[9px] font-medium bg-transparent outline-none focus:border-solid focus:border-[#1e4a8a] focus:bg-blue-50/40 dark:focus:bg-blue-950/20 px-0.5 transition-colors placeholder:text-[#1e4a8a]/35 placeholder:text-[8px]"
              style={{ color: RECEIPT_BLUE }}
            />
          </div>
        ) : (
          <FieldLine label="Prénom :" value={data.prenom} />
        )}
      </div>

      {/* Somme en toutes lettres */}
      <div className="flex items-baseline gap-1">
        <span className="shrink-0 text-[9px] font-semibold whitespace-nowrap">la somme de :</span>
        <span
          className={cn(
            "min-h-[12px] flex-1 border-b pb-px text-[9px] font-medium overflow-hidden text-ellipsis whitespace-nowrap",
            sommeLettres ? "font-semibold italic" : "text-[#1e4a8a]/40 italic text-[8.5px]",
          )}
          style={{ borderColor: RECEIPT_BLUE, color: RECEIPT_BLUE }}
          title={sommeLettres || undefined}
        >
          {sommeLettres || (editable ? "— sera inscrite en toutes lettres automatiquement —" : "\u00a0")}
        </span>
      </div>

      {/* Motif */}
      {editable ? (
        <div className="flex min-w-0 w-full items-baseline gap-1">
          <span className="shrink-0 text-[9px] font-semibold whitespace-nowrap" style={{ color: RECEIPT_BLUE }}>
            Motif :
          </span>
          <input
            type="text"
            value={data.motif || ""}
            onChange={(e) => onFieldChange?.("motif", e.target.value)}
            placeholder="Motif du paiement (ex: Frais de transit...)"
            className="min-h-[13px] flex-1 border-b border-dashed border-[#1e4a8a]/40 pb-px text-[9px] font-medium bg-transparent outline-none focus:border-solid focus:border-[#1e4a8a] focus:bg-blue-50/40 dark:focus:bg-blue-950/20 px-0.5 transition-colors placeholder:text-[#1e4a8a]/35 placeholder:text-[8px]"
            style={{ color: RECEIPT_BLUE }}
          />
        </div>
      ) : (
        <FieldLine label="Motif :" value={data.motif} className="w-full flex-none [&_span:last-child]:whitespace-normal" />
      )}

      {/* Montants & Reste */}
      <div className="flex gap-4">
        {editable ? (
          <div className="flex min-w-0 flex-1 items-baseline gap-1">
            <span className="shrink-0 text-[9px] font-semibold whitespace-nowrap" style={{ color: RECEIPT_BLUE }}>
              Montant payé :
            </span>
            <input
              type="text"
              value={montantPayeInput ?? (data.montantPaye ? String(data.montantPaye) : "")}
              onChange={(e) => onFieldChange?.("montantPaye", e.target.value)}
              placeholder="Montant FCFA"
              className="min-h-[13px] flex-1 border-b border-dashed border-[#1e4a8a]/40 pb-px text-[9px] font-bold font-mono bg-transparent outline-none focus:border-solid focus:border-[#1e4a8a] focus:bg-blue-50/40 dark:focus:bg-blue-950/20 px-0.5 transition-colors placeholder:text-[#1e4a8a]/35 placeholder:text-[8px]"
              style={{ color: RECEIPT_BLUE }}
            />
          </div>
        ) : (
          <FieldLine label="Montant payé :" value={montantPayeAffiche} />
        )}

        <FieldLine label="Reste :" value={resteAffiche} />
      </div>

      {/* Date et Signature */}
      <div className="mt-0.5 flex items-end justify-between gap-3">
        {/* Jamais éditable : la date du reçu est celle de sa génération (createdAt). */}
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

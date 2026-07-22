"use client";

import {
  formatSocieteLegalLine,
  hasSocieteLogo,
  type SocieteBrand,
} from "@/lib/societe-brand";

/** En-tête document facture — aligné sur printFactureModule (logo seul si configuré). */
export function FactureDocumentHeader({ brand }: { brand: SocieteBrand }) {
  const legalLine = formatSocieteLegalLine(brand.legal);

  if (hasSocieteLogo(brand)) {
    return (
      <div className="border-b border-border/60 pb-4">
        <img
          src={brand.logoUrl}
          alt={brand.nom}
          className="h-16 w-auto max-w-[280px] object-contain sm:h-20 sm:max-w-[320px]"
        />
      </div>
    );
  }

  return (
    <div className="border-b border-border/60 pb-4">
      <p className="text-lg font-extrabold tracking-tight text-blue-700 dark:text-blue-400">
        {brand.nom}
      </p>
      {legalLine ? (
        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {legalLine}
        </p>
      ) : null}
    </div>
  );
}

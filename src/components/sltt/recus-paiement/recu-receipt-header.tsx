"use client";

import { resolveLogoUrl } from "@/lib/export/print-document";
import { RECEIPT_BLUE } from "@/lib/recus-paiement-styles";
import type { SocieteBrand } from "@/lib/societe-brand";

interface RecuReceiptHeaderProps {
  brand: SocieteBrand;
}

/** En-tête paysage — logo à gauche, identité société + titre à droite. */
export function RecuReceiptHeader({ brand }: RecuReceiptHeaderProps) {
  const logoUrl = resolveLogoUrl(brand.logoUrl);
  const showName = brand.afficherNomAvecLogo !== false;

  return (
    <header className="mb-3 flex items-start gap-3 border-b border-[#1e4a8a]/20 pb-2.5">
      {logoUrl ? (
        <img src={logoUrl} alt={brand.nom} className="size-14 shrink-0 object-contain" />
      ) : (
        <div
          className="size-14 shrink-0 rounded-full border border-dashed opacity-40"
          style={{ borderColor: RECEIPT_BLUE }}
        />
      )}
      <div className="min-w-0 flex-1">
        {showName ? (
          <div
            className="text-sm font-extrabold uppercase leading-tight tracking-wide"
            style={{ color: RECEIPT_BLUE }}
          >
            {brand.nom}
          </div>
        ) : null}
        {brand.legal?.adresse ? (
          <div className="text-[8.5px] leading-snug" style={{ color: RECEIPT_BLUE }}>
            {brand.legal.adresse}
          </div>
        ) : null}
        {brand.legal?.rccm ? (
          <div className="text-[8.5px] leading-snug" style={{ color: RECEIPT_BLUE }}>
            RCCM : {brand.legal.rccm}
          </div>
        ) : null}
        {brand.legal?.telephone ? (
          <div className="text-[8.5px] leading-snug" style={{ color: RECEIPT_BLUE }}>
            Tél. : {brand.legal.telephone}
          </div>
        ) : null}
        <div
          className="mt-1.5 text-[11px] font-extrabold uppercase tracking-widest"
          style={{ color: RECEIPT_BLUE }}
        >
          Reçu de paiement
        </div>
      </div>
    </header>
  );
}

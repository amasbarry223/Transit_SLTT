"use client";

import { resolveLogoUrl } from "@/lib/export/print-document";
import {
  RECEIPT_BLUE,
  RECEIPT_LOGO_COL_MM,
  RECEIPT_LOGO_FALLBACK,
  RECEIPT_LOGO_MAX_HEIGHT_MM,
} from "@/lib/recus-paiement-styles";
import type { SocieteBrand } from "@/lib/societe-brand";

interface RecuReceiptHeaderProps {
  brand: SocieteBrand;
}

/** En-tête paysage — logo à gauche, identité société centrée, titre en bas. */
export function RecuReceiptHeader({ brand }: RecuReceiptHeaderProps) {
  const logoUrl = resolveLogoUrl(brand.logoUrl) ?? RECEIPT_LOGO_FALLBACK;
  const showName = brand.afficherNomAvecLogo !== false;

  return (
    <header
      className="mb-2 flex items-start gap-2 border-b border-[#1e4a8a]/30 pb-2"
      style={{ color: RECEIPT_BLUE }}
    >
      <div
        className="flex shrink-0 items-center justify-center"
        style={{ width: `${RECEIPT_LOGO_COL_MM}mm` }}
      >
        <img
          src={logoUrl}
          alt={brand.nom}
          className="object-contain"
          style={{
            maxWidth: `${RECEIPT_LOGO_COL_MM}mm`,
            maxHeight: `${RECEIPT_LOGO_MAX_HEIGHT_MM}mm`,
          }}
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src.includes(RECEIPT_LOGO_FALLBACK)) return;
            img.src = RECEIPT_LOGO_FALLBACK;
          }}
        />
      </div>

      <div className="min-w-0 flex-1 text-center">
        {showName ? (
          <div className="text-[12px] font-extrabold uppercase leading-tight tracking-wide">{brand.nom}</div>
        ) : null}
        {brand.legal?.adresse ? (
          <div className="text-[7.5px] leading-snug">{brand.legal.adresse}</div>
        ) : null}
        {brand.legal?.rccm ? (
          <div className="text-[7.5px] leading-snug">RCCM : {brand.legal.rccm}</div>
        ) : null}
        {brand.legal?.telephone ? (
          <div className="text-[7.5px] leading-snug">Tél. : {brand.legal.telephone}</div>
        ) : null}
        <div className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.14em]">Reçu de paiement</div>
      </div>

      {/* Équilibre visuel — espace miroir du logo */}
      <div className="shrink-0" style={{ width: `${RECEIPT_LOGO_COL_MM}mm` }} aria-hidden />
    </header>
  );
}

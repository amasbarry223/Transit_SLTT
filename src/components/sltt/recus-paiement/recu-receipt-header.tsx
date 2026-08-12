"use client";

import { resolveLogoUrl } from "@/lib/export/print-document";
import { RECEIPT_BLUE, RECEIPT_LOGO_FALLBACK } from "@/lib/recus-paiement-styles";
import type { SocieteBrand } from "@/lib/societe-brand";

interface RecuReceiptHeaderProps {
  brand: SocieteBrand;
}

/** En-tête paysage — logo à gauche, identité société centrée, titre en bas. */
export function RecuReceiptHeader({ brand }: RecuReceiptHeaderProps) {
  const logoUrl = resolveLogoUrl(brand.logoUrl) ?? RECEIPT_LOGO_FALLBACK;
  const showName = brand.afficherNomAvecLogo !== false;

  return (
    <header className="mb-3 flex items-start gap-4 border-b border-[#1e4a8a]/20 pb-3">
      <div className="flex w-[18mm] shrink-0 items-center justify-center">
        <img
          src={logoUrl}
          alt={brand.nom}
          className="max-h-[16mm] max-w-[18mm] object-contain"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src.includes(RECEIPT_LOGO_FALLBACK)) return;
            img.src = RECEIPT_LOGO_FALLBACK;
          }}
        />
      </div>

      <div className="min-w-0 flex-1 text-center">
        {showName ? (
          <div
            className="text-[13px] font-extrabold uppercase leading-tight tracking-wide"
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
          className="mt-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em]"
          style={{ color: RECEIPT_BLUE }}
        >
          Reçu de paiement
        </div>
      </div>

      {/* Équilibre visuel — espace miroir du logo */}
      <div className="w-[18mm] shrink-0" aria-hidden />
    </header>
  );
}

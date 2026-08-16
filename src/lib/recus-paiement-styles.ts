/** Constantes visuelles partagées entre l'aperçu React et le HTML d'impression. */
export const RECEIPT_BLUE = "#1e4a8a";
export const RECEIPT_PAPER = "#dce8f5";
/** Logo par défaut si la société n'en a pas configuré un. */
export const RECEIPT_LOGO_FALLBACK = "/logoV.png";

/**
 * Format personnalisé carnet TRAORE — paysage.
 * Largeur 19,5 cm × Hauteur 8,2 cm — ratio 2,377:1.
 * Impression verrouillée sur ces dimensions : pas A4, pas autre format.
 */
export const RECEIPT_WIDTH_MM = 195;
export const RECEIPT_HEIGHT_MM = 82;
export const RECEIPT_WIDTH_CM = 19.5;
export const RECEIPT_HEIGHT_CM = 8.2;
export const RECEIPT_ASPECT_RATIO = RECEIPT_WIDTH_MM / RECEIPT_HEIGHT_MM;

/** Libellés affichés dans l'UI */
export const RECEIPT_FORMAT_LABEL = "19,5 × 8,2 cm";
export const RECEIPT_FORMAT_LABEL_MM = "195 × 82 mm";

/** Iframe d'impression dédiée au reçu (dimensions ≠ A4). */
export const RECEIPT_PRINT_FRAME_ID = "sltt-print-frame-recu";

/** Layout interne — calibré pour 195×82 mm (proportionnel à la maquette). */
export const RECEIPT_PADDING_V_MM = 6.5;
export const RECEIPT_PADDING_H_MM = 8;
export const RECEIPT_LOGO_COL_MM = 15;
export const RECEIPT_LOGO_MAX_HEIGHT_MM = 13;
export const RECEIPT_SIG_WIDTH_MM = 31;
export const RECEIPT_SIG_HEIGHT_MM = 14.5;

/**
 * CSS strict — une seule page ${RECEIPT_WIDTH_MM}×${RECEIPT_HEIGHT_MM} mm (19,5×8,2 cm).
 * Le document HTML d'impression ne contient QUE le reçu (pas de toolbar, pas de marge A4).
 */
export function buildReceiptPrintCSS(options?: { includeScreenToolbar?: boolean }): string {
  const includeToolbar = options?.includeScreenToolbar ?? false;

  return `
* { box-sizing: border-box; margin: 0; padding: 0; }
html {
  width: ${RECEIPT_WIDTH_MM}mm;
  height: ${RECEIPT_HEIGHT_MM}mm;
  overflow: hidden;
}
body {
  width: ${RECEIPT_WIDTH_MM}mm;
  height: ${RECEIPT_HEIGHT_MM}mm;
  overflow: hidden;
  font-family: Arial, Helvetica, sans-serif;
  background: ${RECEIPT_PAPER};
  color: ${RECEIPT_BLUE};
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.receipt-paper {
  width: ${RECEIPT_WIDTH_MM}mm;
  height: ${RECEIPT_HEIGHT_MM}mm;
  margin: 0;
  background: ${RECEIPT_PAPER};
  padding: ${RECEIPT_PADDING_V_MM}mm ${RECEIPT_PADDING_H_MM}mm;
  color: ${RECEIPT_BLUE};
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding-bottom: 5px;
  margin-bottom: 5px;
  border-bottom: 1px solid rgba(30, 74, 138, 0.35);
}
.brand-logo {
  max-width: ${RECEIPT_LOGO_COL_MM}mm;
  max-height: ${RECEIPT_LOGO_MAX_HEIGHT_MM}mm;
  object-fit: contain;
  flex-shrink: 0;
}
.header-logo {
  width: ${RECEIPT_LOGO_COL_MM}mm;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.header-spacer {
  width: ${RECEIPT_LOGO_COL_MM}mm;
  flex-shrink: 0;
}
.header-text {
  flex: 1;
  min-width: 0;
  text-align: center;
}
.brand-name {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  line-height: 1.2;
  margin-bottom: 1px;
}
.header-legal-line {
  font-size: 7.5px;
  line-height: 1.35;
}
.doc-title {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 4px;
}
.body {
  font-size: 9px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.field-row--split {
  display: flex;
  gap: 12px;
}
.field-line {
  display: flex;
  align-items: baseline;
  gap: 3px;
  flex: 1;
  min-width: 0;
}
.field-label {
  flex-shrink: 0;
  font-weight: 600;
  white-space: nowrap;
  font-size: 9px;
}
.field-value {
  flex: 1;
  border-bottom: 1px solid ${RECEIPT_BLUE};
  min-height: 12px;
  padding-bottom: 1px;
  font-weight: 500;
  font-size: 9px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.somme-row {
  display: flex;
  align-items: baseline;
  gap: 3px;
}
.somme-label {
  flex-shrink: 0;
  font-weight: 600;
  font-size: 9px;
}
.somme-value {
  flex: 1;
  border-bottom: 1px solid ${RECEIPT_BLUE};
  min-height: 12px;
  padding-bottom: 1px;
  font-size: 9px;
}
.field-row--single .field-line { flex: none; width: 100%; }
.field-row--single .field-value { white-space: normal; }
.field-row--footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding-top: 2px;
}
.field-row--footer .field-line { max-width: 55%; flex: none; }
.sig-box {
  width: ${RECEIPT_SIG_WIDTH_MM}mm;
  height: ${RECEIPT_SIG_HEIGHT_MM}mm;
  border: 1.5px solid ${RECEIPT_BLUE};
  border-radius: 6px;
  padding: 3px 5px;
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.sig-label {
  font-size: 8px;
  font-weight: 700;
}
.sig-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
${
  includeToolbar
    ? `
.no-print {
  text-align: center;
  padding: 12px;
  background: #f3f5f7;
  border-bottom: 1px solid #d2dbe9;
}
.btn-print {
  background: ${RECEIPT_BLUE};
  color: #fff;
  border: none;
  padding: 9px 24px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}`
    : ""
}
@media print {
  @page {
    size: ${RECEIPT_WIDTH_MM}mm ${RECEIPT_HEIGHT_MM}mm;
    margin: 0;
  }
  html, body {
    width: ${RECEIPT_WIDTH_MM}mm !important;
    height: ${RECEIPT_HEIGHT_MM}mm !important;
    min-width: ${RECEIPT_WIDTH_MM}mm !important;
    min-height: ${RECEIPT_HEIGHT_MM}mm !important;
    max-width: ${RECEIPT_WIDTH_MM}mm !important;
    max-height: ${RECEIPT_HEIGHT_MM}mm !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
  }
  body {
    background: ${RECEIPT_PAPER} !important;
  }
  .receipt-paper {
    position: fixed;
    top: 0;
    left: 0;
    width: ${RECEIPT_WIDTH_MM}mm !important;
    height: ${RECEIPT_HEIGHT_MM}mm !important;
    margin: 0 !important;
    page-break-before: avoid !important;
    page-break-after: avoid !important;
    page-break-inside: avoid !important;
  }
  ${includeToolbar ? ".no-print { display: none !important; }" : ""}
}`;
}

/** Répartit un texte long sur N lignes (équilibré par mots). */
export function splitTextIntoLines(text: string, lineCount: number): string[] {
  const words = text.trim().split(/\s+/);
  if (words.length === 0) return Array.from({ length: lineCount }, () => "");
  if (words.length <= lineCount) {
    const lines = [...words];
    while (lines.length < lineCount) lines.push("");
    return lines;
  }
  const lines: string[] = [];
  const chunkSize = Math.ceil(words.length / lineCount);
  for (let i = 0; i < lineCount; i++) {
    lines.push(words.slice(i * chunkSize, (i + 1) * chunkSize).join(" "));
  }
  return lines;
}

/** Styles CSS partagés entre les documents d'impression SLTT. */
import { BRAND } from "@/lib/brand-colors";

/** Styles du gabarit générique printHTML / buildPrintDocument. */
export const PRINT_HTML_DOCUMENT_CSS = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: #1f2937;
      background: #fff;
      font-size: 12px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .wrap { max-width: 100%; margin: 0 auto; }
    .doc-section { padding: 16px 28px 0; }
    .doc-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      padding-bottom: 12px;
    }
    .doc-eyebrow {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: ${BRAND.red};
      margin-bottom: 3px;
    }
    .doc-title {
      font-size: 18px;
      font-weight: 800;
      color: ${BRAND.navy};
      letter-spacing: -0.02em;
      line-height: 1.1;
    }
    .doc-meta { text-align: right; flex-shrink: 0; font-size: 12px; color: #6b7280; }
    .doc-date { font-size: 10px; color: #6b7280; }
    .doc-body { padding: 0 28px 28px; }
    h1 { font-size: 20px; margin: 0 0 4px; color: ${BRAND.navy}; }
    .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th {
      background: #f3f5f7; color: #45556b; text-align: left;
      padding: 10px 12px; font-weight: 600; font-size: 11px;
      text-transform: uppercase; letter-spacing: 0.04em;
      border-bottom: 1px solid #d2dbe9;
    }
    td { padding: 10px 12px; border-bottom: 1px solid #d2dbe9; }
    tr:last-child td { border-bottom: none; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .total-row td { font-weight: 700; background: #f8fafc; border-top: 2px solid ${BRAND.navy}; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #d2dbe9;
      font-size: 11px; color: #45556b; text-align: center; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px;
      font-size: 11px; font-weight: 500; }
    @media print {
      @page { size: A4 portrait; margin: 12mm 10mm; }
      body { padding: 0; }
      .no-print { display: none !important; }
      tr { page-break-inside: avoid; }
    }`;

/** En-tête papier officiel — marque à gauche, coordonnées à droite, double filet. */
export const OFFICIAL_LETTERHEAD_CSS = `
  .official-letterhead {
    padding: 16px 32px 0;
    background: #fff;
  }
  .official-letterhead-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
  }
  .official-letterhead-brand {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 0 1 auto;
    min-width: 0;
  }
  .official-letterhead-logo-wrap {
    flex-shrink: 0;
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
  }
  .official-letterhead-logo {
    width: 120px;
    height: 120px;
    object-fit: contain;
    background: transparent;
  }
  .official-letterhead-name {
    flex: 0 1 auto;
    min-width: 0;
  }
  .official-letterhead-name-line {
    font-family: Arial, 'Segoe UI', system-ui, sans-serif;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: ${BRAND.navy};
    line-height: 1.12;
  }
  .official-letterhead-name-line + .official-letterhead-name-line {
    margin-top: 1px;
  }
  .official-letterhead-legal-block {
    flex-shrink: 0;
    text-align: right;
    align-self: center;
    margin-left: auto;
  }
  .official-letterhead-line {
    font-family: Arial, 'Segoe UI', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 400;
    line-height: 1.45;
    color: #1f2937;
  }
  .official-letterhead-line + .official-letterhead-line {
    margin-top: 2px;
  }
  .official-letterhead-legal {
    font-size: 13px;
    color: #4b5563;
  }
  .official-letterhead-rule {
    margin-top: 16px;
    border-bottom: 3px solid ${BRAND.navy};
    position: relative;
  }
  .official-letterhead-rule::after {
    content: "";
    display: block;
    border-bottom: 1px solid ${BRAND.red};
    margin-top: 3px;
  }`;

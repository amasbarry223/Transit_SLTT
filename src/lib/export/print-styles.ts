/** Styles CSS partagés entre les documents d'impression SLTT. */

export const PRINT_RESET_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }`;

export const PRINT_BODY_SLTT_CSS = `
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; }`;

export const PRINT_WRAP_CSS = `
.wrap { max-width: 760px; margin: 0 auto; background: #fff; box-shadow: 0 0 0 1px #e2e8f0; }`;

export const PRINT_DOC_HEADER_CSS = `
.doc-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 36px 40px 28px; border-bottom: 3px solid #1e40af; }`;

export const PRINT_BRAND_CSS = `
.brand { display: flex; align-items: flex-start; gap: 14px; }
.brand-logo { width: 64px; height: 64px; object-fit: contain; }
.brand-name { font-size: 20px; font-weight: 800; color: #1e40af; letter-spacing: -.5px; margin-bottom: 3px; }
.brand-sub { font-size: 10.5px; color: #64748b; line-height: 1.7; }`;

export const PRINT_DOC_META_CSS = `
.doc-meta { text-align: right; }
.doc-type { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #94a3b8; margin-bottom: 6px; }
.doc-ref { font-size: 22px; font-weight: 800; color: #1e40af; letter-spacing: -1px; line-height: 1.1; }
.doc-date { font-size: 11px; color: #64748b; margin-top: 5px; }`;

export const PRINT_BODY_SECTION_CSS = `
.body { padding: 32px 40px; }`;

export const PRINT_TABLE_BASE_CSS = `
.tbl-wrap { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 8px; }
table { width: 100%; border-collapse: collapse; }
.tbl-head { background: #1e3a8a; }
.tbl-head th { color: #fff; padding: 10px 14px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }`;

export const PRINT_FOOTER_CSS = `
.footer { padding: 14px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; line-height: 1.6; }`;

export const PRINT_NO_PRINT_BAR_CSS = `
.no-print { text-align: center; padding: 18px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
.btn-print { background: #1e40af; color: #fff; border: none; padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }`;

export const PRINT_NO_PRINT_BAR_HTML = `
  <div class="no-print">
    <button class="btn-print" onclick="window.print()">⬇ &nbsp;Imprimer / Enregistrer en PDF</button>
  </div>`;

/** Styles communs aux documents SLTT (devis, factures module, contrats, etc.). */
export const PRINT_SLTT_COMMON_CSS = [
  PRINT_RESET_CSS,
  PRINT_BODY_SLTT_CSS,
  PRINT_WRAP_CSS,
  PRINT_DOC_HEADER_CSS,
  PRINT_BRAND_CSS,
  PRINT_DOC_META_CSS,
  PRINT_BODY_SECTION_CSS,
  PRINT_TABLE_BASE_CSS,
  PRINT_FOOTER_CSS,
  PRINT_NO_PRINT_BAR_CSS,
  `@media print {
  .no-print { display: none !important; }
  body { background: white; }
  .wrap { box-shadow: none; }
}`,
].join("\n");

/** Styles du gabarit générique printHTML / buildPrintDocument. */
export const PRINT_HTML_DOCUMENT_CSS = `
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      padding: 40px;
      margin: 0;
    }
    h1 { font-family: 'Sora', sans-serif; font-size: 20px; margin: 0 0 4px; }
    .subtitle { color: #64748b; font-size: 13px; margin-bottom: 24px; }
    .doc-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 2px solid #1e40af; padding-bottom: 16px; margin-bottom: 24px;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    /* Hauteur fixe, largeur libre : les logos des sociétés n'ont pas tous le
       même ratio (badge carré vs bannière large) — une boîte carrée écraserait
       une bannière large en un filet illisible. */
    .brand-logo {
      height: 48px; width: auto; max-width: 160px;
      object-fit: contain;
    }
    .brand-name { font-weight: 700; font-size: 15px; }
    .brand-sub { font-size: 11px; color: #64748b; }
    .doc-meta { text-align: right; font-size: 12px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th {
      background: #f1f5f9; color: #475569; text-align: left;
      padding: 10px 12px; font-weight: 600; font-size: 11px;
      text-transform: uppercase; letter-spacing: 0.04em;
      border-bottom: 1px solid #e2e8f0;
    }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
    tr:last-child td { border-bottom: none; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .total-row td { font-weight: 700; background: #f8fafc; border-top: 2px solid #1e40af; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0;
      font-size: 11px; color: #475569; text-align: center; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px;
      font-size: 11px; font-weight: 500; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }`;

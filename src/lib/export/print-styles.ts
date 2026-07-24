/** Styles CSS partagés entre les documents d'impression SLTT. */

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

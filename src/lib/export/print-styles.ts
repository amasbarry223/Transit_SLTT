/** Styles CSS partagés entre les documents d'impression SLTT. */
import { BRAND } from "@/lib/brand-colors";

/** Styles du gabarit générique printHTML / buildPrintDocument. */
export const PRINT_HTML_DOCUMENT_CSS = `
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1f2937;
      padding: 40px;
      margin: 0;
    }
    h1 { font-family: 'Sora', sans-serif; font-size: 20px; margin: 0 0 4px; }
    .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
    .doc-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 2px solid ${BRAND.navy}; padding-bottom: 16px; margin-bottom: 24px;
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
    .brand-sub { font-size: 11px; color: #6b7280; }
    .doc-meta { text-align: right; font-size: 12px; color: #6b7280; }
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
      body { padding: 0; }
      .no-print { display: none; }
    }`;

/** En-tête papier officiel — marque à gauche, coordonnées à droite, double filet. */
export const OFFICIAL_LETTERHEAD_CSS = `
  .official-letterhead {
    padding: 20px 28px 0;
    background: #fff;
  }
  .official-letterhead-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
  }
  .official-letterhead-brand {
    display: flex;
    align-items: center;
    gap: 18px;
    flex: 1;
    min-width: 0;
  }
  .official-letterhead-logo-wrap {
    flex-shrink: 0;
    width: 130px;
    height: 130px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
  }
  .official-letterhead-logo {
    width: 130px;
    height: 130px;
    object-fit: contain;
    background: transparent;
  }
  .official-letterhead-name {
    flex: 1;
    min-width: 0;
  }
  .official-letterhead-name-l1,
  .official-letterhead-name-l2 {
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 23px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${BRAND.navy};
    line-height: 1.15;
  }
  .official-letterhead-name-l2 {
    margin-top: 2px;
  }
  .official-letterhead-legal-block {
    flex-shrink: 0;
    text-align: right;
    align-self: center;
  }
  .official-letterhead-line {
    font-size: 13.5px;
    line-height: 1.5;
    color: #374151;
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

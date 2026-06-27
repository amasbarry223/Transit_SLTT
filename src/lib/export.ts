"use client";

function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

interface Column<T> {
  header: string;
  accessor: (row: T) => string | number;
}

/**
 * Export an array of rows to a CSV file and trigger download.
 * Uses BOM for Excel UTF-8 compatibility.
 */
export function exportToCSV<T>(
  filename: string,
  columns: Column<T>[],
  rows: T[],
): void {
  const headerLine = columns.map((c) => csvEscape(c.header)).join(";");
  const dataLines = rows.map((row) =>
    columns.map((c) => csvEscape(c.accessor(row))).join(";"),
  );
  const csv = "\uFEFF" + [headerLine, ...dataLines].join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Print a specific HTML string in a new window.
 * Useful for generating a clean PDF/document without the app chrome.
 */
export function printHTML(title: string, bodyHTML: string): void {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    // Popup blocked — fallback to printing current page
    window.print();
    return;
  }
  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
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
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-logo {
      width: 36px; height: 36px; border-radius: 8px;
      background: #1e40af; color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px;
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
      font-size: 11px; color: #94a3b8; text-align: center; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px;
      font-size: 11px; font-weight: 500; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <div class="brand">
      <div class="brand-logo">ST</div>
      <div>
        <div class="brand-name">SLTT</div>
        <div class="brand-sub">Société Traoré de Logistique, Transit et Transport</div>
      </div>
    </div>
    <div class="doc-meta">
      <div style="font-weight:600;color:#0f172a">${title}</div>
      <div>Édité le ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</div>
    </div>
  </div>
  ${bodyHTML}
  <div class="footer">Document généré par la plateforme SLTT · © 2026</div>
</body>
</html>`);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 300);
}

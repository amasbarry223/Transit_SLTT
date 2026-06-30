"use client";

/** SEC-06: Escape HTML special characters to prevent injection in generated documents. */
function htmlEscape(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** BUG-03: fmtFCFA and fmtDate declared before first use (printDevis) */
function fmtFCFA(n: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n)) + " FCFA";
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
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

/* ------------------------------------------------------------------ */
/* printDevis — Document devis/estimation avec logo SLTT               */
/* ------------------------------------------------------------------ */

export interface DevisData {
  reference: string;
  clientNom: string;
  clientAdresse?: string;
  clientTelephone?: string;
  clientEmail?: string;
  nature: string;
  dateCreation: string;
  dateValidite: string;
  droitDouane: number;
  fraisCircuit: number;
  fraisPrestation: number;
  total: number;
  notes?: string;
  statut?: string;
}

export function printDevis(data: DevisData): void {
  /* Logo sur fond blanc — même technique que printHTML (Bons de sortie).
     Pas de filtre, pas de gradient : le logo s'affiche correctement à l'écran ET à l'impression. */
  const logoUrl = typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "/logo.png";
  const fmtD = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  const items = [
    { label: "Droits de douane estimés", value: data.droitDouane,    color: "#2563eb", bg: "#dbeafe" },
    { label: "Frais de circuit global",  value: data.fraisCircuit,   color: "#7c3aed", bg: "#ede9fe" },
    { label: "Prestation SLTT",         value: data.fraisPrestation, color: "#ea580c", bg: "#ffedd5" },
  ];

  const rowsHTML = items.map((r) => {
    const pct = data.total > 0 ? Math.round((r.value / data.total) * 100) : 0;
    return `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;vertical-align:top">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${r.color};flex-shrink:0"></span>
          <span style="font-size:13px;color:#0f172a">${r.label}</span>
        </div>
        <div style="height:5px;background:#f1f5f9;border-radius:9999px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${r.color};border-radius:9999px"></div>
        </div>
      </td>
      <td style="padding:12px 10px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:11px;color:#94a3b8;width:50px;vertical-align:middle">${pct}%</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;text-align:right;font-variant-numeric:tabular-nums;font-weight:600;font-size:13px;color:#0f172a;width:165px;vertical-align:middle">${fmtFCFA(r.value)}</td>
    </tr>`;
  }).join("");

  const win = window.open("", "_blank", "width=880,height=760");
  if (!win) { window.print(); return; }

  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Devis ${data.reference}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; }
.wrap { max-width: 760px; margin: 0 auto; background: #fff; box-shadow: 0 0 0 1px #e2e8f0; }

/* ── Header (fond blanc, logo visible à l'impression) ── */
.doc-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 36px 40px 28px;
  border-bottom: 3px solid #1e40af;
}
.brand { display: flex; align-items: flex-start; gap: 14px; }
.brand-logo { width: 64px; height: 64px; object-fit: contain; }
.brand-name { font-size: 20px; font-weight: 800; color: #1e40af; letter-spacing: -.5px; margin-bottom: 3px; }
.brand-sub { font-size: 10.5px; color: #64748b; line-height: 1.7; }
.doc-meta { text-align: right; }
.doc-type { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #94a3b8; margin-bottom: 6px; }
.doc-ref { font-size: 30px; font-weight: 800; color: #1e40af; letter-spacing: -1.5px; line-height: 1; }
.doc-date { font-size: 11px; color: #64748b; margin-top: 5px; }
.statut-badge {
  display: inline-block; margin-top: 8px;
  padding: 4px 12px; border-radius: 9999px;
  font-size: 11px; font-weight: 700; letter-spacing: .04em;
  background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;
}

/* ── Body ── */
.body { padding: 32px 40px; }

/* Parties */
.parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
.party { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 18px; }
.party-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; margin-bottom: 7px; }
.party-name { font-size: 14px; font-weight: 700; color: #0f172a; }
.party-detail { font-size: 12px; color: #64748b; margin-top: 4px; line-height: 1.7; }

/* Nature */
.nature-block {
  display: flex; align-items: center; gap: 12px;
  background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px;
  padding: 13px 16px; margin-bottom: 24px;
}
.nature-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #93c5fd; margin-bottom: 3px; }
.nature-val { font-size: 14px; font-weight: 700; color: #1e40af; }
.nature-icon { font-size: 22px; line-height: 1; }

/* Table */
.tbl-wrap { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 6px; }
.tbl-head { background: #1e3a8a; }
.tbl-head th { color: #fff; padding: 10px 16px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
.tbl-head th:last-child { text-align: right; }
.tbl-head th:nth-child(2) { text-align: center; width: 50px; }
table { width: 100%; border-collapse: collapse; }

/* Total */
.total-wrap { background: #1e3a8a; border-radius: 10px; overflow: hidden; }
.total-inner { display: flex; justify-content: space-between; align-items: center; padding: 16px 18px; }
.total-lbl { font-size: 14px; font-weight: 700; color: #fff; }
.total-amt { font-size: 24px; font-weight: 800; letter-spacing: -1px; font-variant-numeric: tabular-nums; color: #fff; }

/* Validity */
.validity { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 13px 18px; margin-top: 20px; font-size: 12px; color: #374151; line-height: 1.65; }
.validity strong { color: #15803d; }

/* Notes */
.notes-block { background: #fafafa; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; margin-top: 16px; }
.notes-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; margin-bottom: 8px; }
.notes-text { font-size: 12.5px; color: #475569; line-height: 1.8; white-space: pre-wrap; }

/* Signatures */
.sig-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
.sig-box { border: 1.5px dashed #cbd5e1; border-radius: 10px; padding: 18px 16px; min-height: 88px; }
.sig-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; }
.sig-note { font-size: 10.5px; color: #cbd5e1; margin-top: 24px; }

/* Footer */
.footer { padding: 14px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.footer-note { font-size: 10px; color: #94a3b8; line-height: 1.65; }
.footer-brand { font-size: 11px; font-weight: 800; color: #1e40af; }

/* Bouton impression (caché à l'impression) */
.no-print { text-align: center; padding: 18px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
.btn-print { background: #1e40af; color: #fff; border: none; padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; letter-spacing: .01em; }

@media print {
  .no-print { display: none !important; }
  body { background: white; }
  .wrap { box-shadow: none; }
  .brand-logo { width: 56px; height: 56px; }
}
</style>
</head>
<body>
<div class="wrap">

  <div class="no-print">
    <button class="btn-print" onclick="window.print()">⬇ &nbsp;Imprimer / Enregistrer en PDF</button>
  </div>

  <!-- En-tête blanc avec logo visible à l'impression -->
  <div class="doc-header">
    <div class="brand">
      <img src="${logoUrl}" alt="SLTT" class="brand-logo" onerror="this.style.display='none'">
      <div>
        <div class="brand-name">SLTT</div>
        <div class="brand-sub">
          Société Traoré de Logistique, Transit et Transport<br>
          Bamako, Mali &nbsp;·&nbsp; contact@sltt.ml
        </div>
      </div>
    </div>
    <div class="doc-meta">
      <div class="doc-type">Devis / Estimation</div>
      <div class="doc-ref">${htmlEscape(data.reference)}</div>
      <div class="doc-date">Émis le ${fmtD(data.dateCreation)}</div>
      <div><span class="statut-badge">${htmlEscape(data.statut ?? "Devis")}</span></div>
    </div>
  </div>

  <div class="body">

    <!-- Parties -->
    <div class="parties">
      <div class="party">
        <div class="party-lbl">Prestataire</div>
        <div class="party-name">SLTT</div>
        <div class="party-detail">Société Traoré de Logistique<br>Transit et Transport<br>Bamako, Mali · contact@sltt.ml</div>
      </div>
      <div class="party">
        <div class="party-lbl">Client</div>
        <div class="party-name">${htmlEscape(data.clientNom)}</div>
        <div class="party-detail">${[data.clientAdresse, data.clientTelephone, data.clientEmail].filter(Boolean).map(htmlEscape).join("<br>") || "—"}</div>
      </div>
    </div>

    <!-- Nature -->
    <div class="nature-block">
      <div class="nature-icon">📦</div>
      <div>
        <div class="nature-lbl">Nature de la marchandise</div>
        <div class="nature-val">${htmlEscape(data.nature)}</div>
      </div>
      <div style="margin-left:auto;text-align:right">
        <div class="nature-lbl">Validité</div>
        <div style="font-size:12px;font-weight:600;color:#1e40af">${fmtD(data.dateCreation)} → ${fmtD(data.dateValidite)}</div>
      </div>
    </div>

    <!-- Tableau des prestations -->
    <div class="tbl-wrap">
      <table>
        <thead class="tbl-head">
          <tr>
            <th>Désignation de la prestation</th>
            <th style="text-align:center;width:50px">Part</th>
            <th style="text-align:right;width:165px">Montant (FCFA)</th>
          </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
      </table>
    </div>

    <!-- Total -->
    <div class="total-wrap">
      <div class="total-inner">
        <span class="total-lbl">Total estimé</span>
        <span class="total-amt">${fmtFCFA(data.total)}</span>
      </div>
    </div>

    <!-- Validité -->
    <div class="validity">
      ✅ &nbsp;Ce devis est valable jusqu'au <strong>${fmtD(data.dateValidite)}</strong>.
      Passé ce délai, veuillez nous contacter pour renouveler l'estimation.
    </div>

    ${data.notes ? `
    <div class="notes-block">
      <div class="notes-lbl">Notes &amp; conditions</div>
      <div class="notes-text">${htmlEscape(data.notes)}</div>
    </div>` : ""}

    <!-- Signatures -->
    <div class="sig-row">
      <div class="sig-box">
        <div class="sig-lbl">Signature &amp; cachet du client</div>
        <div class="sig-note">Lu et approuvé</div>
      </div>
      <div class="sig-box">
        <div class="sig-lbl">Cachet &amp; signature SLTT</div>
        <div class="sig-note">Pour la direction</div>
      </div>
    </div>

  </div><!-- /body -->

  <div class="footer">
    <div class="footer-note">
      Estimation provisoire · Non contractuel sans signature des deux parties<br>
      Généré par la plateforme SLTT · © ${new Date().getFullYear()}
    </div>
    <div class="footer-brand">SLTT · sltt.ml</div>
  </div>

</div>
</body>
</html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

/* ------------------------------------------------------------------ */

export interface InvoiceData {
  reference: string;
  clientNom: string;
  clientAdresse?: string;
  clientTelephone?: string;
  clientEmail?: string;
  nature: string;
  bl?: string;
  date: string;
  droitDouane: number;
  fraisCircuit: number;
  fraisPrestation: number;
  montantInvesti: number;
  montantPaye: number;
  modePaiement?: string;
}

export function printInvoice(data: InvoiceData, invoiceNum: string): void {
  const logoUrl = typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "/logo.png";
  const reste    = Math.max(0, data.montantInvesti - data.montantPaye);
  const soldé    = reste === 0;
  const today    = fmtDate(new Date().toISOString().slice(0, 10));

  const lignes = [
    { label: "Droits de douane",        montant: data.droitDouane,    color: "#2563eb", bg: "#dbeafe" },
    { label: "Frais de circuit global",  montant: data.fraisCircuit,   color: "#7c3aed", bg: "#ede9fe" },
    { label: "Frais de prestation SLTT", montant: data.fraisPrestation, color: "#ea580c", bg: "#ffedd5" },
  ];

  const lignesHTML = lignes.map((l) => {
    const pct = data.montantInvesti > 0 ? Math.round((l.montant / data.montantInvesti) * 100) : 0;
    return `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;vertical-align:top">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${l.color};flex-shrink:0"></span>
          <span style="font-size:13px;color:#0f172a">${l.label}</span>
        </div>
        <div style="height:5px;background:#f1f5f9;border-radius:9999px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${l.color};border-radius:9999px"></div>
        </div>
      </td>
      <td style="padding:12px 10px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:11px;color:#94a3b8;width:50px;vertical-align:middle">${pct}%</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;text-align:right;font-variant-numeric:tabular-nums;font-weight:600;font-size:13px;width:165px;vertical-align:middle">${fmtFCFA(l.montant)}</td>
    </tr>`;
  }).join("");

  const win = window.open("", "_blank", "width=880,height=760");
  if (!win) { window.print(); return; }

  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Facture ${invoiceNum}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; }
.wrap { max-width: 760px; margin: 0 auto; background: #fff; box-shadow: 0 0 0 1px #e2e8f0; }

/* Header */
.doc-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 36px 40px 28px; border-bottom: 3px solid #1e40af; }
.brand { display: flex; align-items: flex-start; gap: 14px; }
.brand-logo { width: 64px; height: 64px; object-fit: contain; }
.brand-name { font-size: 20px; font-weight: 800; color: #1e40af; letter-spacing: -.5px; margin-bottom: 3px; }
.brand-sub { font-size: 10.5px; color: #64748b; line-height: 1.7; }
.doc-meta { text-align: right; }
.doc-type { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #94a3b8; margin-bottom: 6px; }
.doc-ref { font-size: 28px; font-weight: 800; color: #1e40af; letter-spacing: -1.5px; line-height: 1; }
.doc-dossier { font-size: 12px; color: #64748b; margin-top: 6px; }
.doc-date { font-size: 11px; color: #94a3b8; margin-top: 4px; }
.statut-badge { display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: .04em; }
.statut-solde { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
.statut-partiel { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }

/* Body */
.body { padding: 32px 40px; }

/* Parties */
.parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 22px; }
.party { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 18px; }
.party-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; margin-bottom: 7px; }
.party-name { font-size: 14px; font-weight: 700; color: #0f172a; }
.party-detail { font-size: 12px; color: #64748b; margin-top: 4px; line-height: 1.7; }

/* Dossier ref block */
.ref-block { display: flex; gap: 20px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 13px 18px; margin-bottom: 22px; flex-wrap: wrap; }
.ref-item { }
.ref-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #93c5fd; margin-bottom: 3px; }
.ref-val { font-size: 13px; font-weight: 700; color: #1e40af; }

/* Table prestations */
.tbl-wrap { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 6px; }
table { width: 100%; border-collapse: collapse; }
.tbl-head { background: #1e3a8a; }
.tbl-head th { color: #fff; padding: 10px 16px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }

/* Totaux */
.totals { margin-top: 12px; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; }
.total-line { display: flex; justify-content: space-between; align-items: center; padding: 11px 18px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
.total-line:last-child { border-bottom: none; }
.total-main { background: #1e3a8a; color: #fff; }
.total-main .lbl { font-weight: 700; font-size: 14px; }
.total-main .amt { font-size: 22px; font-weight: 800; letter-spacing: -1px; font-variant-numeric: tabular-nums; }
.total-paye .lbl { color: #15803d; font-weight: 600; }
.total-paye .amt { color: #15803d; font-weight: 700; font-variant-numeric: tabular-nums; }
.total-reste .lbl { font-weight: 600; color: #0f172a; }
.total-reste .amt-due { color: #dc2626; font-weight: 700; font-variant-numeric: tabular-nums; font-size: 15px; }
.total-reste .amt-ok  { color: #15803d; font-weight: 700; font-variant-numeric: tabular-nums; font-size: 15px; }

/* Signatures */
.sig-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 28px; }
.sig-box { border: 1.5px dashed #cbd5e1; border-radius: 10px; padding: 16px; min-height: 88px; }
.sig-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; }
.sig-note { font-size: 10.5px; color: #cbd5e1; margin-top: 24px; }

/* Footer */
.footer { padding: 14px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.footer-note { font-size: 10px; color: #94a3b8; line-height: 1.65; }
.footer-brand { font-size: 11px; font-weight: 800; color: #1e40af; }

/* Bouton impression */
.no-print { text-align: center; padding: 18px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
.btn-print { background: #1e40af; color: #fff; border: none; padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }

@media print {
  .no-print { display: none !important; }
  body { background: white; }
  .wrap { box-shadow: none; }
}
</style>
</head>
<body>
<div class="wrap">

  <div class="no-print">
    <button class="btn-print" onclick="window.print()">⬇ &nbsp;Imprimer / Enregistrer en PDF</button>
  </div>

  <!-- Header -->
  <div class="doc-header">
    <div class="brand">
      <img src="${logoUrl}" alt="SLTT" class="brand-logo" onerror="this.style.display='none'">
      <div>
        <div class="brand-name">SLTT</div>
        <div class="brand-sub">Société Traoré de Logistique, Transit et Transport<br>Bamako, Mali &nbsp;·&nbsp; contact@sltt.ml</div>
      </div>
    </div>
    <div class="doc-meta">
      <div class="doc-type">Facture de transit</div>
      <div class="doc-ref">FACTURE</div>
      <div class="doc-dossier">${htmlEscape(invoiceNum)}</div>
      <div class="doc-date">Émise le ${today}</div>
      <div><span class="statut-badge ${soldé ? "statut-solde" : "statut-partiel"}">${soldé ? "✓ SOLDÉ" : "PAIEMENT PARTIEL"}</span></div>
    </div>
  </div>

  <div class="body">

    <!-- Parties -->
    <div class="parties">
      <div class="party">
        <div class="party-lbl">Prestataire</div>
        <div class="party-name">SLTT</div>
        <div class="party-detail">Société Traoré de Logistique<br>Transit et Transport<br>Bamako, Mali · contact@sltt.ml</div>
      </div>
      <div class="party">
        <div class="party-lbl">Client</div>
        <div class="party-name">${htmlEscape(data.clientNom)}</div>
        <div class="party-detail">${[data.clientAdresse, data.clientTelephone, data.clientEmail].filter(Boolean).map(htmlEscape).join("<br>") || "—"}</div>
      </div>
    </div>

    <!-- Dossier info -->
    <div class="ref-block">
      <div class="ref-item">
        <div class="ref-lbl">Dossier de transit</div>
        <div class="ref-val">${htmlEscape(data.reference)}</div>
      </div>
      <div class="ref-item">
        <div class="ref-lbl">Nature de la marchandise</div>
        <div class="ref-val">${htmlEscape(data.nature)}</div>
      </div>
      ${data.bl ? `<div class="ref-item"><div class="ref-lbl">Connaissement (BL)</div><div class="ref-val">${htmlEscape(data.bl)}</div></div>` : ""}
      ${data.date ? `<div class="ref-item"><div class="ref-lbl">Date du dossier</div><div class="ref-val">${fmtDate(data.date)}</div></div>` : ""}
    </div>

    <!-- Tableau des prestations -->
    <div class="tbl-wrap">
      <table>
        <thead class="tbl-head">
          <tr>
            <th style="text-align:left">Désignation de la prestation</th>
            <th style="text-align:center;width:50px">Part</th>
            <th style="text-align:right;width:165px">Montant (FCFA)</th>
          </tr>
        </thead>
        <tbody>${lignesHTML}</tbody>
      </table>
    </div>

    <!-- Totaux -->
    <div class="totals">
      <div class="total-line total-main">
        <span class="lbl">Total dossier</span>
        <span class="amt">${fmtFCFA(data.montantInvesti)}</span>
      </div>
      <div class="total-line total-paye">
        <span class="lbl">Montant reçu${data.modePaiement ? ` — ${htmlEscape(data.modePaiement)}` : ""}</span>
        <span class="amt">${fmtFCFA(data.montantPaye)}</span>
      </div>
      <div class="total-line total-reste">
        <span class="lbl">Reste à payer</span>
        <span class="${reste > 0 ? "amt-due" : "amt-ok"}">${fmtFCFA(reste)}</span>
      </div>
    </div>

    <!-- Signatures -->
    <div class="sig-row">
      <div class="sig-box">
        <div class="sig-lbl">Signature &amp; cachet du client</div>
        <div class="sig-note">Lu et approuvé</div>
      </div>
      <div class="sig-box">
        <div class="sig-lbl">Cachet &amp; signature SLTT</div>
        <div class="sig-note">Pour la direction</div>
      </div>
    </div>

  </div>

  <div class="footer">
    <div class="footer-note">
      Ce document tient lieu de facture provisoire jusqu'à signature des deux parties.<br>
      Généré par la plateforme SLTT · © ${new Date().getFullYear()}
    </div>
    <div class="footer-brand">SLTT · sltt.ml</div>
  </div>

</div>
</body>
</html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
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
      width: 64px; height: 64px;
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
      <img class="brand-logo" src="${window.location.origin}/logo.png" alt="SLTT" />
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

/* ------------------------------------------------------------------ */
/* printClients — annuaire clients avec stats                           */
/* ------------------------------------------------------------------ */

export interface ClientPrintRow {
  nom: string;
  type: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  nbDossiers: number;
  totalDu: number;
}

export function printClients(
  rows: ClientPrintRow[],
  filterLabel?: string,
): void {
  const logoUrl      = typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "/logo.png";
  const today        = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const totalCreance = rows.reduce((s, r) => s + r.totalDu, 0);
  const nbEntreprises  = rows.filter((r) => r.type === "Entreprise").length;
  const nbParticuliers = rows.filter((r) => r.type === "Particulier").length;
  const totalDossiers  = rows.reduce((s, r) => s + r.nbDossiers, 0);

  const initiales = (nom: string) =>
    nom.trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const rowsHTML = rows.map((r, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
      <td style="padding:11px 14px;border-bottom:1px solid #f1f5f9;vertical-align:middle">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:34px;height:34px;border-radius:50%;background:${r.type === "Entreprise" ? "linear-gradient(135deg,#2563eb,#4f46e5)" : "linear-gradient(135deg,#475569,#1e293b)"};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${initiales(r.nom)}</div>
          <div>
            <div style="font-weight:600;color:#0f172a;font-size:13px">${r.nom}</div>
            <div style="font-size:10px;color:#94a3b8;margin-top:1px;background:${r.type === "Entreprise" ? "#eff6ff" : "#f8fafc"};color:${r.type === "Entreprise" ? "#1e40af" : "#64748b"};border:1px solid ${r.type === "Entreprise" ? "#bfdbfe" : "#e2e8f0"};display:inline-block;padding:1px 7px;border-radius:9999px;font-weight:600">${r.type}</div>
          </div>
        </div>
      </td>
      <td style="padding:11px 14px;border-bottom:1px solid #f1f5f9;color:#475569;font-size:12px;vertical-align:middle">${r.telephone ?? "<span style='color:#cbd5e1'>—</span>"}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #f1f5f9;color:#475569;font-size:12px;vertical-align:middle">${r.email ?? "<span style='color:#cbd5e1'>—</span>"}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #f1f5f9;color:#475569;font-size:12px;vertical-align:middle">${r.adresse ?? "<span style='color:#cbd5e1'>—</span>"}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:13px;font-weight:600;color:#0f172a;vertical-align:middle">${r.nbDossiers}</td>
      <td style="padding:11px 14px;border-bottom:1px solid #f1f5f9;text-align:right;font-variant-numeric:tabular-nums;font-weight:700;font-size:13px;color:${r.totalDu > 0 ? "#b45309" : "#15803d"};vertical-align:middle">${r.totalDu > 0 ? fmtFCFA(r.totalDu) : "Soldé"}</td>
    </tr>`).join("");

  const win = window.open("", "_blank", "width=1060,height=820");
  if (!win) { window.print(); return; }

  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Annuaire clients — SLTT</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; }
.wrap { max-width: 1000px; margin: 0 auto; background: #fff; box-shadow: 0 0 0 1px #e2e8f0; }

/* Header — fond blanc, logo visible à l'impression */
.doc-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 36px 44px 28px; border-bottom: 3px solid #1e40af; }
.brand { display: flex; align-items: flex-start; gap: 14px; }
.brand-logo { width: 64px; height: 64px; object-fit: contain; }
.brand-name { font-size: 20px; font-weight: 800; color: #1e40af; letter-spacing: -.5px; margin-bottom: 3px; }
.brand-sub { font-size: 10.5px; color: #64748b; line-height: 1.7; }
.doc-meta { text-align: right; }
.doc-type { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #94a3b8; margin-bottom: 6px; }
.doc-title { font-size: 28px; font-weight: 800; color: #1e40af; letter-spacing: -1px; line-height: 1; }
.doc-date { font-size: 11px; color: #64748b; margin-top: 5px; }
.doc-filter { display: inline-block; margin-top: 7px; background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; border-radius: 9999px; padding: 3px 12px; font-size: 10.5px; font-weight: 700; }

/* KPI band */
.kpi-band { display: flex; gap: 0; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.kpi { flex: 1; padding: 18px 20px; border-right: 1px solid #e2e8f0; }
.kpi:last-child { border-right: none; }
.kpi-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; margin-bottom: 5px; }
.kpi-val { font-size: 22px; font-weight: 800; color: #1e40af; line-height: 1; }
.kpi-sub { font-size: 10px; color: #94a3b8; margin-top: 3px; }

/* Table */
.tbl-outer { padding: 28px 44px 32px; }
.tbl-wrap { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
.tbl-head { background: #1e3a8a; }
.tbl-head th { color: #fff; padding: 10px 14px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
.tbl-foot td { background: #1e3a8a; color: #fff; padding: 12px 14px; font-weight: 700; font-size: 13px; }
.tbl-foot .amt { text-align: right; font-variant-numeric: tabular-nums; color: #fde68a; font-size: 15px; }

/* Footer */
.footer { padding: 14px 44px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.footer-note { font-size: 10px; color: #94a3b8; line-height: 1.65; }
.footer-brand { font-size: 11px; font-weight: 800; color: #1e40af; }

/* Print button */
.no-print { text-align: center; padding: 16px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
.btn-print { background: #1e40af; color: #fff; border: none; padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }

@media print {
  .no-print { display: none !important; }
  body { background: white; }
  .wrap { box-shadow: none; }
}
</style>
</head>
<body>
<div class="wrap">

  <div class="no-print">
    <button class="btn-print" onclick="window.print()">⬇ &nbsp;Imprimer / Enregistrer en PDF</button>
  </div>

  <!-- Header -->
  <div class="doc-header">
    <div class="brand">
      <img src="${logoUrl}" alt="SLTT" class="brand-logo" onerror="this.style.display='none'">
      <div>
        <div class="brand-name">SLTT</div>
        <div class="brand-sub">Société Traoré de Logistique, Transit et Transport<br>Bamako, Mali &nbsp;·&nbsp; contact@sltt.ml</div>
      </div>
    </div>
    <div class="doc-meta">
      <div class="doc-type">Document interne</div>
      <div class="doc-title">Annuaire clients</div>
      <div class="doc-date">Édité le ${today}</div>
      ${filterLabel ? `<div class="doc-filter">${filterLabel}</div>` : ""}
    </div>
  </div>

  <!-- KPIs -->
  <div class="kpi-band">
    <div class="kpi">
      <div class="kpi-lbl">Total clients</div>
      <div class="kpi-val">${rows.length}</div>
      <div class="kpi-sub">dans cette sélection</div>
    </div>
    <div class="kpi">
      <div class="kpi-lbl">Entreprises</div>
      <div class="kpi-val">${nbEntreprises}</div>
      <div class="kpi-sub">clients professionnels</div>
    </div>
    <div class="kpi">
      <div class="kpi-lbl">Particuliers</div>
      <div class="kpi-val">${nbParticuliers}</div>
      <div class="kpi-sub">clients individuels</div>
    </div>
    <div class="kpi">
      <div class="kpi-lbl">Total dossiers</div>
      <div class="kpi-val">${totalDossiers}</div>
      <div class="kpi-sub">dossiers traités</div>
    </div>
    <div class="kpi">
      <div class="kpi-lbl">Créances totales</div>
      <div class="kpi-val" style="font-size:16px;color:${totalCreance > 0 ? "#b45309" : "#15803d"}">${fmtFCFA(totalCreance)}</div>
      <div class="kpi-sub">reste à encaisser</div>
    </div>
  </div>

  <!-- Table -->
  <div class="tbl-outer">
    <div class="tbl-wrap">
      <table>
        <thead class="tbl-head">
          <tr>
            <th style="text-align:left;width:230px">Client</th>
            <th style="text-align:left;width:120px">Téléphone</th>
            <th style="text-align:left;width:175px">E-mail</th>
            <th style="text-align:left">Adresse</th>
            <th style="text-align:center;width:72px">Dossiers</th>
            <th style="text-align:right;width:145px">Total dû</th>
          </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
        <tfoot class="tbl-foot">
          <tr>
            <td colspan="4">Total &mdash; ${rows.length} client${rows.length !== 1 ? "s" : ""}</td>
            <td style="text-align:center;color:#fff;font-variant-numeric:tabular-nums">${totalDossiers}</td>
            <td class="amt">${fmtFCFA(totalCreance)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>

  <div class="footer">
    <div class="footer-note">
      Document confidentiel · usage interne uniquement<br>
      Généré par la plateforme SLTT · © ${new Date().getFullYear()}
    </div>
    <div class="footer-brand">SLTT · sltt.ml</div>
  </div>

</div>
</body>
</html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

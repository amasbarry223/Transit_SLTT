"use client";

import type { AuditModule } from "@/lib/audit";
import { useStore } from "@/lib/store";
/**
 * SEC-06: Escape HTML special characters to prevent injection in generated documents.
 * Exported so that screen-level printHTML templates escape user-entered data
 * (client names, notes, references…) instead of interpolating it raw.
 */
export function htmlEscape(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


function getLogoUrl(): string {
  return typeof window !== "undefined" ? `${window.location.origin}/logoV.png` : "/logoV.png";
}

/** Attend le chargement des images avant d'ouvrir la boîte d'impression. */
function triggerPrint(win: Window, delayMs = 400): void {
  const doPrint = () => {
    win.focus();
    win.print();
  };
  const imgs = Array.from(win.document.images);
  const pending = imgs.filter((img) => !img.complete);
  if (pending.length === 0) {
    setTimeout(doPrint, delayMs);
    return;
  }
  let loaded = 0;
  const done = () => {
    loaded += 1;
    if (loaded >= pending.length) setTimeout(doPrint, 80);
  };
  pending.forEach((img) => {
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
  });
  setTimeout(doPrint, 2500);
}

function downloadBlob(blob: Blob, filename: string): void {
  const nav = window.navigator as Navigator & {
    msSaveOrOpenBlob?: (b: Blob, name: string) => void;
  };
  if (nav.msSaveOrOpenBlob) {
    nav.msSaveOrOpenBlob(blob, filename);
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 4000);
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

function csvCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  // Neutralise l'injection de formule Excel/LibreOffice (OWASP CSV Injection) :
  // préfixe d'une apostrophe toute valeur commençant par =, +, -, @, tab ou CR.
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  if (/[",\n;\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function encodeCsvForExcel(text: string): Blob {
  const bytes = new TextEncoder().encode(`\uFEFF${text}`);
  return new Blob([bytes], { type: "text/csv;charset=utf-8;" });
}

/** Construit le blob CSV (UTF-8 BOM) — exposé pour les tests unitaires. */
export function buildCsvBlob<T>(
  columns: Column<T>[],
  rows: T[],
): Blob {
  const headerLine = columns.map((c) => csvCell(c.header)).join(";");
  const dataLines = rows.map((row) =>
    columns.map((c) => csvCell(c.accessor(row))).join(";"),
  );
  const csvText = `sep=;\r\n${[headerLine, ...dataLines].join("\r\n")}`;
  return encodeCsvForExcel(csvText);
}

/**
 * Export tabulaire compatible Excel (séparateur ;, encodage UTF-8 BOM).
 * Ouvre correctement dans Excel Windows avec accents et colonnes séparées.
 */
export function exportToCSV<T>(
  filename: string,
  columns: Column<T>[],
  rows: T[],
  audit?: { module: AuditModule },
): void {
  if (rows.length === 0) return;

  const baseName = filename.replace(/\.(csv|xls|xlsx)$/i, "");
  downloadBlob(buildCsvBlob(columns, rows), `${baseName}.csv`);

  if (audit) {
    void useStore.getState().addAuditLog(
      audit.module,
      "Export",
      `Export ${baseName} — ${rows.length} ligne${rows.length !== 1 ? "s" : ""}`,
    );
  }
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
  const logoUrl = getLogoUrl();
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
  triggerPrint(win);
}

/* ------------------------------------------------------------------ */
/* printFactureModule — facture TVA (module Factures)                  */
/* ------------------------------------------------------------------ */

/**
 * Source de vérité unique pour "faut-il afficher la ligne TVA ?" (F2 — TVA
 * optionnelle). Réutilisée ici, dans facture-detail.tsx et factures.tsx pour
 * éviter toute divergence entre le PDF, le détail et le formulaire.
 */
export function shouldShowTva(tauxTVA: number): boolean {
  return tauxTVA > 0;
}

export interface FactureModuleData {
  numero: string;
  clientNom: string;
  date: string;
  dateEcheance: string;
  statut: string;
  lignes: Array<{ description: string; quantite: number; prixUnitaire: number; montantHT: number }>;
  tauxTVA: number;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  montantPaye: number;
  notes: string;
  creePar: string;
  creeLe: string;
  dossierReference?: string;
  dossierBl?: string;
}

export function printFactureModule(data: FactureModuleData): void {
  const logoUrl = getLogoUrl();
  const fmtD = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  const lignesHTML = data.lignes.map((l, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9">${htmlEscape(l.description)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:center;font-variant-numeric:tabular-nums">${l.quantite}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right;font-variant-numeric:tabular-nums">${fmtFCFA(l.prixUnitaire)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right;font-variant-numeric:tabular-nums;font-weight:600">${fmtFCFA(l.montantHT)}</td>
    </tr>`).join("");

  const reste = Math.max(0, data.montantTTC - data.montantPaye);
  const paiementHTML = data.montantPaye > 0 ? `
    <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#15803d">
      <span>Déjà payé</span><span style="font-variant-numeric:tabular-nums">- ${fmtFCFA(data.montantPaye)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;font-weight:600;color:#b45309">
      <span>Reste à payer</span><span style="font-variant-numeric:tabular-nums">${fmtFCFA(reste)}</span>
    </div>` : "";

  const win = window.open("", "_blank", "width=880,height=760");
  if (!win) { window.print(); return; }

  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Facture ${htmlEscape(data.numero)}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; }
.wrap { max-width: 760px; margin: 0 auto; background: #fff; box-shadow: 0 0 0 1px #e2e8f0; }
.doc-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 36px 40px 28px; border-bottom: 3px solid #1e40af; }
.brand { display: flex; align-items: flex-start; gap: 14px; }
.brand-logo { width: 64px; height: 64px; object-fit: contain; }
.brand-name { font-size: 20px; font-weight: 800; color: #1e40af; letter-spacing: -.5px; margin-bottom: 3px; }
.brand-sub { font-size: 10.5px; color: #64748b; line-height: 1.7; }
.doc-meta { text-align: right; }
.doc-type { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #94a3b8; margin-bottom: 6px; }
.doc-ref { font-size: 22px; font-weight: 800; color: #1e40af; letter-spacing: -1px; line-height: 1.1; }
.doc-date { font-size: 11px; color: #64748b; margin-top: 5px; }
.body { padding: 32px 40px; }
.client-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 18px; margin-bottom: 24px; }
.client-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; margin-bottom: 6px; }
.client-name { font-size: 15px; font-weight: 700; color: #0f172a; }
.client-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
.tbl-wrap { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 20px; }
table { width: 100%; border-collapse: collapse; }
.tbl-head { background: #1e3a8a; }
.tbl-head th { color: #fff; padding: 10px 14px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
.totals { width: 280px; margin-left: auto; }
.total-line { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #475569; }
.total-main { border-top: 2px solid #0f172a; margin-top: 6px; padding-top: 10px; font-weight: 800; font-size: 15px; color: #1e40af; }
.notes { border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px; font-size: 12px; color: #64748b; }
.footer { padding: 14px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; line-height: 1.6; }
.no-print { text-align: center; padding: 18px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
.btn-print { background: #1e40af; color: #fff; border: none; padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
@media print { .no-print { display: none !important; } body { background: white; } .wrap { box-shadow: none; } }
</style>
</head>
<body>
<div class="wrap">
  <div class="no-print">
    <button class="btn-print" onclick="window.print()">⬇ &nbsp;Imprimer / Enregistrer en PDF</button>
  </div>
  <div class="doc-header">
    <div class="brand">
      <img src="${logoUrl}" alt="SLTT" class="brand-logo">
      <div>
        <div class="brand-name">SLTT</div>
        <div class="brand-sub">Société Traoré de Logistique, Transit et Transport<br>Bamako, Mali &nbsp;·&nbsp; contact@sltt.ml</div>
      </div>
    </div>
    <div class="doc-meta">
      <div class="doc-type">Facture</div>
      <div class="doc-ref">${htmlEscape(data.numero)}</div>
      <div class="doc-date">Date : ${fmtD(data.date)}</div>
      <div class="doc-date">Échéance : ${fmtD(data.dateEcheance)}</div>
      <div class="doc-date">Statut : ${htmlEscape(data.statut)}</div>
    </div>
  </div>
  <div class="body">
    <div class="client-box">
      <div class="client-lbl">Facturé à</div>
      <div class="client-name">${htmlEscape(data.clientNom)}</div>
      ${data.dossierReference ? `<div class="client-sub">Dossier lié : ${htmlEscape(data.dossierReference)}${data.dossierBl ? ` · BL ${htmlEscape(data.dossierBl)}` : ""}</div>` : ""}
    </div>
    <div class="tbl-wrap">
      <table>
        <thead class="tbl-head">
          <tr>
            <th style="text-align:left">Description</th>
            <th style="text-align:center;width:60px">Qté</th>
            <th style="text-align:right;width:130px">P.U. HT</th>
            <th style="text-align:right;width:140px">Montant HT</th>
          </tr>
        </thead>
        <tbody>${lignesHTML}</tbody>
      </table>
    </div>
    <div class="totals">
      <div class="total-line"><span>Sous-total HT</span><span style="font-variant-numeric:tabular-nums">${fmtFCFA(data.montantHT)}</span></div>
      ${shouldShowTva(data.tauxTVA) ? `<div class="total-line"><span>TVA ${data.tauxTVA}%</span><span style="font-variant-numeric:tabular-nums">${fmtFCFA(data.montantTVA)}</span></div>` : ""}
      <div class="total-line total-main"><span>TOTAL TTC</span><span style="font-variant-numeric:tabular-nums">${fmtFCFA(data.montantTTC)}</span></div>
      ${paiementHTML}
    </div>
    ${data.notes ? `<div class="notes"><strong style="color:#334155">Notes</strong><p style="margin-top:6px;white-space:pre-wrap">${htmlEscape(data.notes)}</p></div>` : ""}
  </div>
  <div class="footer">
    Facture générée par le système SLTT · ${htmlEscape(data.creePar)} · ${fmtD(data.creeLe)}<br>
    Merci de votre confiance. Paiement par virement ou espèces.
  </div>
</div>
</body>
</html>`);
  win.document.close();
  triggerPrint(win);
}

/* ------------------------------------------------------------------ */
/* CONTRATS (F3) — impression                                          */
/* ------------------------------------------------------------------ */

export interface ContratModuleData {
  reference: string;
  societeNom: string;
  clientNom: string;
  objet: string;
  dateDebut: string;
  dateFin?: string;
  montant: number;
  statut: string;
  notes?: string;
  depenses: Array<{ libelle: string; date: string; modePaiement: string; montant: number }>;
  prestations: Array<{ libelle: string; statut: string; montant?: number }>;
  documents: Array<{ nom: string; dateUpload: string }>;
}

export function printContratModule(data: ContratModuleData): void {
  const logoUrl = getLogoUrl();
  const fmtD = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  const totalDepenses = data.depenses.reduce((sum, d) => sum + d.montant, 0);
  const depensesHTML = data.depenses.map((d, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9">${htmlEscape(d.libelle)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9">${fmtD(d.date)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9">${htmlEscape(d.modePaiement)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right;font-variant-numeric:tabular-nums">${fmtFCFA(d.montant)}</td>
    </tr>`).join("");

  const nbRealisees = data.prestations.filter((p) => p.statut === "Réalisée").length;
  const prestationsHTML = data.prestations.map((p, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9">${htmlEscape(p.libelle)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9">${htmlEscape(p.statut)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right;font-variant-numeric:tabular-nums">${p.montant != null ? fmtFCFA(p.montant) : "—"}</td>
    </tr>`).join("");

  const documentsHTML = data.documents.map((f) => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px;color:#475569">
      <span>${htmlEscape(f.nom)}</span><span>${fmtD(f.dateUpload)}</span>
    </div>`).join("");

  const win = window.open("", "_blank", "width=880,height=760");
  if (!win) { window.print(); return; }

  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Contrat ${htmlEscape(data.reference)}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; }
.wrap { max-width: 760px; margin: 0 auto; background: #fff; box-shadow: 0 0 0 1px #e2e8f0; }
.doc-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 36px 40px 28px; border-bottom: 3px solid #1e40af; }
.brand { display: flex; align-items: flex-start; gap: 14px; }
.brand-logo { width: 64px; height: 64px; object-fit: contain; }
.brand-name { font-size: 20px; font-weight: 800; color: #1e40af; letter-spacing: -.5px; margin-bottom: 3px; }
.brand-sub { font-size: 10.5px; color: #64748b; line-height: 1.7; }
.doc-meta { text-align: right; }
.doc-type { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #94a3b8; margin-bottom: 6px; }
.doc-ref { font-size: 22px; font-weight: 800; color: #1e40af; letter-spacing: -1px; line-height: 1.1; }
.doc-date { font-size: 11px; color: #64748b; margin-top: 5px; }
.body { padding: 32px 40px; }
.client-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 18px; margin-bottom: 24px; }
.client-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; margin-bottom: 6px; }
.client-name { font-size: 15px; font-weight: 700; color: #0f172a; }
.client-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
.section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #1e40af; margin: 22px 0 10px; }
.tbl-wrap { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 8px; }
table { width: 100%; border-collapse: collapse; }
.tbl-head { background: #1e3a8a; }
.tbl-head th { color: #fff; padding: 10px 14px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
.total-line { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; font-weight: 700; color: #0f172a; }
.notes { border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px; font-size: 12px; color: #64748b; }
.footer { padding: 14px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; line-height: 1.6; }
.no-print { text-align: center; padding: 18px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
.btn-print { background: #1e40af; color: #fff; border: none; padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
@media print { .no-print { display: none !important; } body { background: white; } .wrap { box-shadow: none; } }
</style>
</head>
<body>
<div class="wrap">
  <div class="no-print">
    <button class="btn-print" onclick="window.print()">⬇ &nbsp;Imprimer / Enregistrer en PDF</button>
  </div>
  <div class="doc-header">
    <div class="brand">
      <img src="${logoUrl}" alt="SLTT" class="brand-logo">
      <div>
        <div class="brand-name">SLTT</div>
        <div class="brand-sub">Société Traoré de Logistique, Transit et Transport<br>Bamako, Mali &nbsp;·&nbsp; contact@sltt.ml</div>
      </div>
    </div>
    <div class="doc-meta">
      <div class="doc-type">Contrat</div>
      <div class="doc-ref">${htmlEscape(data.reference)}</div>
      <div class="doc-date">Société : ${htmlEscape(data.societeNom)}</div>
      <div class="doc-date">Début : ${fmtD(data.dateDebut)}${data.dateFin ? ` · Fin : ${fmtD(data.dateFin)}` : ""}</div>
      <div class="doc-date">Statut : ${htmlEscape(data.statut)}</div>
    </div>
  </div>
  <div class="body">
    <div class="client-box">
      <div class="client-lbl">Client</div>
      <div class="client-name">${htmlEscape(data.clientNom)}</div>
      <div class="client-sub">${htmlEscape(data.objet)} · ${fmtFCFA(data.montant)}</div>
    </div>

    <div class="section-title">Dépenses (${data.depenses.length})</div>
    <div class="tbl-wrap">
      <table>
        <thead class="tbl-head">
          <tr><th style="text-align:left">Libellé</th><th style="text-align:left">Date</th><th style="text-align:left">Mode</th><th style="text-align:right">Montant</th></tr>
        </thead>
        <tbody>${depensesHTML || `<tr><td colspan="4" style="padding:14px;text-align:center;color:#94a3b8">Aucune dépense</td></tr>`}</tbody>
      </table>
    </div>
    <div class="total-line"><span>Total dépenses</span><span style="font-variant-numeric:tabular-nums">${fmtFCFA(totalDepenses)}</span></div>

    <div class="section-title">Prestations optionnelles (${nbRealisees}/${data.prestations.length} réalisées)</div>
    <div class="tbl-wrap">
      <table>
        <thead class="tbl-head">
          <tr><th style="text-align:left">Libellé</th><th style="text-align:left">Statut</th><th style="text-align:right">Montant</th></tr>
        </thead>
        <tbody>${prestationsHTML || `<tr><td colspan="3" style="padding:14px;text-align:center;color:#94a3b8">Aucune prestation</td></tr>`}</tbody>
      </table>
    </div>

    ${data.documents.length > 0 ? `<div class="section-title">Documents (${data.documents.length})</div>${documentsHTML}` : ""}
    ${data.notes ? `<div class="notes"><strong style="color:#334155">Notes</strong><p style="margin-top:6px;white-space:pre-wrap">${htmlEscape(data.notes)}</p></div>` : ""}
  </div>
  <div class="footer">
    Contrat généré par le système SLTT · ${fmtD(new Date().toISOString())}
  </div>
</div>
</body>
</html>`);
  win.document.close();
  triggerPrint(win);
}

/* ------------------------------------------------------------------ */
/* BON DE SORTIE DE CAISSE (décaissement) — reproduit le vrai papier   */
/* à en-tête de la société mère (adresse, RCCM, NIF réels), avec les   */
/* deux blocs de signature imprimés sur le formulaire physique.        */
/* ------------------------------------------------------------------ */

export interface BonSortieCaisseModuleData {
  reference: string;
  date: string;
  lignes: Array<{ date: string; beneficiaire: string; motif: string; montant: number }>;
  montantTotal: number;
}

export function printBonSortieCaisseModule(data: BonSortieCaisseModuleData): void {
  const logoUrl = getLogoUrl();
  const fmtD = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  const lignesHTML = data.lignes.map((l, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9">${fmtD(l.date)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9">${htmlEscape(l.beneficiaire)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9">${htmlEscape(l.motif)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right;font-variant-numeric:tabular-nums">${fmtFCFA(l.montant)}</td>
    </tr>`).join("");

  const win = window.open("", "_blank", "width=880,height=760");
  if (!win) { window.print(); return; }

  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Bon de sortie ${htmlEscape(data.reference)}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; }
.wrap { max-width: 760px; margin: 0 auto; background: #fff; box-shadow: 0 0 0 1px #e2e8f0; }
.doc-header { display: flex; justify-content: space-between; align-items: center; padding: 28px 40px 22px; border-bottom: 3px solid #1e40af; gap: 20px; }
.brand { display: flex; align-items: center; gap: 18px; min-width: 0; }
.brand-logo { width: 108px; height: 108px; object-fit: contain; flex-shrink: 0; }
.brand-name { font-size: 17px; font-weight: 800; color: #0f172a; letter-spacing: -.3px; line-height: 1.25; text-transform: uppercase; }
.brand-sub { font-size: 10px; color: #64748b; line-height: 1.7; margin-top: 4px; }
.doc-meta { text-align: right; flex-shrink: 0; }
.doc-type { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #94a3b8; margin-bottom: 6px; }
.doc-ref { font-size: 22px; font-weight: 800; color: #1e40af; letter-spacing: -1px; line-height: 1.1; }
.doc-date { font-size: 11px; color: #64748b; margin-top: 5px; }
.body { padding: 28px 40px; }
.doc-title { text-align: center; font-size: 16px; font-weight: 800; letter-spacing: .04em; margin-bottom: 22px; }
.tbl-wrap { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 8px; }
table { width: 100%; border-collapse: collapse; }
.tbl-head { background: #1e3a8a; }
.tbl-head th { color: #fff; padding: 10px 14px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
.total-line { display: flex; justify-content: flex-end; gap: 24px; padding: 10px 0; font-size: 14px; font-weight: 800; color: #0f172a; }
.signatures { display: flex; justify-content: space-between; margin-top: 64px; }
.sig-block { text-align: center; width: 220px; }
.sig-label { font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 48px; }
.sig-name { font-size: 12px; color: #0f172a; border-top: 1px solid #cbd5e1; padding-top: 6px; }
.footer { padding: 12px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 9.5px; color: #94a3b8; text-align: center; }
.no-print { text-align: center; padding: 18px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
.btn-print { background: #1e40af; color: #fff; border: none; padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
@media print {
  .no-print { display: none !important; }
  body { background: white; }
  .wrap { box-shadow: none; }
  .brand-logo { width: 96px; height: 96px; }
}
</style>
</head>
<body>
<div class="wrap">
  <div class="no-print">
    <button class="btn-print" onclick="window.print()">⬇ &nbsp;Imprimer / Enregistrer en PDF</button>
  </div>
  <div class="doc-header">
    <div class="brand">
      <img src="${logoUrl}" alt="Traoré de Logistique" class="brand-logo">
      <div>
        <div class="brand-name">Traoré de Logistique<br>Transit-Transport</div>
        <div class="brand-sub">Niaréla - Rue 516 porte C/63<br>Tél. : +223 76 96 47 06 / 92 92 46 48<br>RCCM : Ma.Bko.2025 B.5897 &nbsp;·&nbsp; NIF : 084151062H</div>
      </div>
    </div>
    <div class="doc-meta">
      <div class="doc-type">Bon de sortie de caisse</div>
      <div class="doc-ref">${htmlEscape(data.reference)}</div>
      <div class="doc-date">Date : ${fmtD(data.date)}</div>
    </div>
  </div>
  <div class="body">
    <div class="doc-title">BON DE SORTIE DE CAISSE ${htmlEscape(data.reference)}</div>
    <div class="tbl-wrap">
      <table>
        <thead class="tbl-head">
          <tr><th style="text-align:left">Dates</th><th style="text-align:left">Prénom et Nom</th><th style="text-align:left">Motif</th><th style="text-align:right">Montant</th></tr>
        </thead>
        <tbody>${lignesHTML || `<tr><td colspan="4" style="padding:14px;text-align:center;color:#94a3b8">Aucune ligne</td></tr>`}</tbody>
      </table>
    </div>
    <div class="total-line"><span>Total</span><span style="font-variant-numeric:tabular-nums">${fmtFCFA(data.montantTotal)}</span></div>

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-label">Directeur Général</div>
        <div class="sig-name">Ali Badra TRAORE</div>
      </div>
      <div class="sig-block">
        <div class="sig-label">Visa du PDG</div>
        <div class="sig-name">Abdoul TRAORÉ</div>
      </div>
    </div>
  </div>
  <div class="footer">
    RCCM : Ma.Bko.2025 B.5897 &nbsp;·&nbsp; NIF : 084151062H
  </div>
</div>
</body>
</html>`);
  win.document.close();
  triggerPrint(win);
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
  const logoUrl = getLogoUrl();
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
  triggerPrint(win);
}

/**
 * Print a specific HTML string in a new window.
 * Useful for generating a clean PDF/document without the app chrome.
 */
export function printHTML(title: string, bodyHTML: string): void {
  const logoUrl = getLogoUrl();
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
  <title>${htmlEscape(title)}</title>
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
      <img class="brand-logo" src="${logoUrl}" alt="SLTT" />
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
  triggerPrint(win);
}

/* ------------------------------------------------------------------ */
/* printStockInventory — inventaire du stock (Entreposage)              */
/* Document A4 paysage : lecture magasin + validation opérationnelle.   */
/* ------------------------------------------------------------------ */

export interface StockInventoryRow {
  marchandise: string;
  quantite: number;
  seuil: number;
  unite: string;
  depositaire: string;
  commercial: string;
  sommePayee: number;
  resteAPayer: number;
  societeNom?: string;
  clientNom?: string;
}

export interface StockInventoryPrintOptions {
  /** Libellé du filtre société actif (ex. « Top Doumani » ou « Toutes les sociétés »). */
  societeLabel?: string;
}

export function printStockInventory(
  rows: StockInventoryRow[],
  options: StockInventoryPrintOptions = {},
): void {
  const logoUrl = getLogoUrl();
  const now = new Date();
  const today = now.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const heure = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const societeLabel = options.societeLabel?.trim() || "Toutes les sociétés";
  const docRef = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;

  const sorted = [...rows].sort((a, b) => {
    const aLow = a.quantite < a.seuil ? 0 : 1;
    const bLow = b.quantite < b.seuil ? 0 : 1;
    if (aLow !== bLow) return aLow - bLow;
    return a.marchandise.localeCompare(b.marchandise, "fr");
  });

  const sumPayee = sorted.reduce((s, r) => s + r.sommePayee, 0);
  const sumReste = sorted.reduce((s, r) => s + r.resteAPayer, 0);
  const valeurTotale = sumPayee + sumReste;
  const nbFaible = sorted.filter((r) => r.quantite < r.seuil).length;
  const nbDisponibles = sorted.length - nbFaible;
  const qteTotale = sorted.reduce((s, r) => s + r.quantite, 0);

  const rowsHTML = sorted
    .map((r, i) => {
      const faible = r.quantite < r.seuil;
      const fillPct =
        r.seuil > 0
          ? Math.min(100, Math.round((r.quantite / Math.max(r.seuil, 1)) * 100))
          : 100;
      const barColor = faible ? "#dc2626" : fillPct >= 150 ? "#059669" : "#2563eb";
      const statutBg = faible ? "#fef2f2" : "#ecfdf5";
      const statutFg = faible ? "#991b1b" : "#065f46";
      const rowBg = faible ? "#fffbeb" : i % 2 === 0 ? "#ffffff" : "#f8fafc";
      const clientLine = r.clientNom
        ? `<div style="font-size:10px;color:#64748b;margin-top:2px">${htmlEscape(r.clientNom)}</div>`
        : "";
      const societeLine = r.societeNom
        ? `<div style="font-size:10px;color:#94a3b8;margin-top:1px">${htmlEscape(r.societeNom)}</div>`
        : "";

      return `
    <tr style="background:${rowBg}">
      <td class="td-idx">${i + 1}</td>
      <td class="td-march">
        <div class="march-name">${htmlEscape(r.marchandise)}</div>
        ${clientLine}${societeLine}
      </td>
      <td class="td-num td-qte">
        <div class="qte-val">${r.quantite.toLocaleString("fr-FR")}</div>
        <div class="qte-bar" title="${fillPct}% du seuil">
          <span style="width:${Math.min(fillPct, 100)}%;background:${barColor}"></span>
        </div>
      </td>
      <td class="td-num muted">${r.seuil.toLocaleString("fr-FR")}</td>
      <td class="td-unit">${htmlEscape(r.unite)}</td>
      <td class="td-text">${htmlEscape(r.depositaire || "—")}</td>
      <td class="td-text">${htmlEscape(r.commercial || "—")}</td>
      <td class="td-num paid">${fmtFCFA(r.sommePayee)}</td>
      <td class="td-num ${r.resteAPayer > 0 ? "due" : "muted"}">${r.resteAPayer > 0 ? fmtFCFA(r.resteAPayer) : "—"}</td>
      <td class="td-statut">
        <span class="badge" style="background:${statutBg};color:${statutFg}">${faible ? "Sous seuil" : "OK"}</span>
      </td>
    </tr>`;
    })
    .join("");

  const win = window.open("", "_blank", "width=1200,height=860");
  if (!win) {
    window.print();
    return;
  }

  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Inventaire ${htmlEscape(docRef)} — SLTT</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,500&family=JetBrains+Mono:wght@500;600&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #e8edf5;
  color: #0f172a;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.wrap {
  max-width: 1180px;
  margin: 18px auto;
  background: #fff;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
  border: 1px solid #dbe3f0;
}

.no-print { text-align: center; padding: 14px 20px; background: #0f172a; }
.btn-print {
  background: #f8fafc; color: #0f172a; border: none;
  padding: 11px 28px; border-radius: 8px; font-size: 13px; font-weight: 700;
  cursor: pointer; letter-spacing: .02em;
}
.btn-print:hover { background: #fff; }

.doc-header {
  display: flex; justify-content: space-between; align-items: center;
  gap: 24px; padding: 28px 36px 22px;
  border-bottom: 3px solid #0b3a82;
  background:
    linear-gradient(180deg, #f8fbff 0%, #ffffff 70%);
}
.brand { display: flex; align-items: center; gap: 16px; min-width: 0; }
.brand-logo { width: 96px; height: 96px; object-fit: contain; flex-shrink: 0; }
.brand-name {
  font-size: 15px; font-weight: 800; color: #0f172a;
  letter-spacing: -.2px; line-height: 1.25; text-transform: uppercase;
}
.brand-sub { font-size: 10px; color: #64748b; line-height: 1.65; margin-top: 4px; }
.doc-meta { text-align: right; flex-shrink: 0; }
.doc-type {
  font-size: 9.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .14em; color: #64748b; margin-bottom: 6px;
}
.doc-title {
  font-size: 26px; font-weight: 800; color: #0b3a82;
  letter-spacing: -0.8px; line-height: 1;
}
.doc-ref {
  margin-top: 8px; display: inline-block;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px; font-weight: 600; color: #1e3a8a;
  background: #eff6ff; border: 1px solid #bfdbfe;
  padding: 4px 10px; border-radius: 6px;
}
.doc-date { font-size: 11px; color: #64748b; margin-top: 6px; }
.scope-chip {
  display: inline-block; margin-top: 8px;
  padding: 3px 10px; border-radius: 9999px;
  font-size: 10.5px; font-weight: 700;
  background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0;
}

.hero {
  padding: 18px 36px 8px;
  display: flex; justify-content: space-between; align-items: flex-end; gap: 16px;
}
.hero-title {
  font-size: 13px; font-weight: 800; letter-spacing: .08em;
  text-transform: uppercase; color: #0f172a;
}
.hero-sub { font-size: 12px; color: #64748b; margin-top: 4px; max-width: 520px; line-height: 1.5; }

.kpi-band {
  display: grid; grid-template-columns: repeat(5, 1fr);
  gap: 10px; padding: 14px 36px 20px;
}
.kpi {
  border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 12px 14px; background: #f8fafc;
}
.kpi.alert { background: #fff7ed; border-color: #fed7aa; }
.kpi.ok { background: #f0fdf4; border-color: #bbf7d0; }
.kpi-lbl {
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .1em; color: #94a3b8; margin-bottom: 6px;
}
.kpi-val {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 18px; font-weight: 600; color: #0b3a82; line-height: 1.1;
}
.kpi.alert .kpi-val { color: #c2410c; }
.kpi.ok .kpi-val { color: #047857; }
.kpi-sub { font-size: 10px; color: #94a3b8; margin-top: 4px; }

.tbl-outer { padding: 4px 36px 8px; }
.tbl-wrap { border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
.tbl-head { background: #0b3a82; }
.tbl-head th {
  color: #e2e8f0; padding: 10px 12px; font-size: 9px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .07em; text-align: left;
  border-bottom: 1px solid #1e3a8a;
}
.tbl-head th.num { text-align: right; }
.td-idx {
  padding: 9px 10px; border-bottom: 1px solid #eef2f7;
  color: #94a3b8; font-size: 10px; width: 28px; vertical-align: middle;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
.td-march { padding: 9px 12px; border-bottom: 1px solid #eef2f7; vertical-align: middle; min-width: 180px; }
.march-name { font-size: 12.5px; font-weight: 700; color: #0f172a; line-height: 1.3; }
.td-num {
  padding: 9px 12px; border-bottom: 1px solid #eef2f7; text-align: right;
  font-variant-numeric: tabular-nums; vertical-align: middle;
  font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11.5px;
}
.td-qte { min-width: 78px; }
.qte-val { font-weight: 700; color: #0f172a; }
.qte-bar {
  margin-top: 5px; height: 4px; background: #e2e8f0; border-radius: 9999px; overflow: hidden;
}
.qte-bar > span { display: block; height: 100%; border-radius: 9999px; }
.td-unit, .td-text {
  padding: 9px 12px; border-bottom: 1px solid #eef2f7;
  font-size: 11.5px; color: #475569; vertical-align: middle;
}
.td-statut { padding: 9px 12px; border-bottom: 1px solid #eef2f7; vertical-align: middle; }
.badge {
  display: inline-block; padding: 3px 8px; border-radius: 6px;
  font-size: 10px; font-weight: 700; letter-spacing: .02em;
}
.paid { color: #047857; font-weight: 600; }
.due { color: #b45309; font-weight: 600; }
.muted { color: #94a3b8; }

.tbl-foot td {
  background: #0b3a82; color: #fff; padding: 11px 12px;
  font-weight: 700; font-size: 12px;
}
.tbl-foot .amt {
  text-align: right; font-variant-numeric: tabular-nums;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  color: #fde68a; font-size: 12.5px;
}

.alert-box {
  margin: 14px 36px 0;
  background: #fff7ed; border: 1px solid #fdba74; border-left: 4px solid #ea580c;
  border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #9a3412; line-height: 1.55;
}
.alert-box strong { color: #7c2d12; }

.signatures {
  display: grid; grid-template-columns: 1fr 1fr 1fr;
  gap: 28px; padding: 36px 36px 18px; margin-top: 8px;
}
.sig-block { text-align: center; }
.sig-label {
  font-size: 10.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .08em; color: #475569; margin-bottom: 52px;
}
.sig-line {
  border-top: 1px solid #94a3b8; padding-top: 8px;
  font-size: 11px; color: #64748b;
}

.footer {
  margin-top: 8px; padding: 14px 36px;
  background: #0f172a; color: #94a3b8;
  display: flex; justify-content: space-between; align-items: center; gap: 16px;
}
.footer-note { font-size: 10px; line-height: 1.55; }
.footer-brand { font-size: 11px; font-weight: 800; color: #e2e8f0; letter-spacing: .04em; }

@media print {
  @page { size: A4 landscape; margin: 10mm; }
  .no-print { display: none !important; }
  body { background: white; margin: 0; }
  .wrap { margin: 0; max-width: none; box-shadow: none; border: none; }
  .brand-logo { width: 78px; height: 78px; }
  .kpi-band { gap: 8px; }
  .signatures { padding-top: 28px; }
  tr { page-break-inside: avoid; }
}
</style>
</head>
<body>
<div class="wrap">
  <div class="no-print">
    <button class="btn-print" onclick="window.print()">Imprimer / Enregistrer en PDF</button>
  </div>

  <div class="doc-header">
    <div class="brand">
      <img src="${logoUrl}" alt="Traoré de Logistique" class="brand-logo" onerror="this.style.display='none'">
      <div>
        <div class="brand-name">Traoré de Logistique<br>Transit-Transport</div>
        <div class="brand-sub">
          Niaréla - Rue 516 porte C/63<br>
          Tél. : +223 76 96 47 06 / 92 92 46 48<br>
          RCCM : Ma.Bko.2025 B.5897 &nbsp;·&nbsp; NIF : 084151062H
        </div>
      </div>
    </div>
    <div class="doc-meta">
      <div class="doc-type">Entreposage · Document interne</div>
      <div class="doc-title">Inventaire stock</div>
      <div class="doc-ref">${htmlEscape(docRef)}</div>
      <div class="doc-date">Édité le ${today} à ${heure}</div>
      <div class="scope-chip">Périmètre : ${htmlEscape(societeLabel)}</div>
    </div>
  </div>

  <div class="hero">
    <div>
      <div class="hero-title">État des stocks</div>
      <div class="hero-sub">
        Synthèse des articles en entrepôt — quantités, seuils d’alerte et valorisation.
        Les lignes sous seuil sont listées en priorité.
      </div>
    </div>
  </div>

  <div class="kpi-band">
    <div class="kpi">
      <div class="kpi-lbl">Références</div>
      <div class="kpi-val">${sorted.length}</div>
      <div class="kpi-sub">articles suivis</div>
    </div>
    <div class="kpi">
      <div class="kpi-lbl">Quantité totale</div>
      <div class="kpi-val">${qteTotale.toLocaleString("fr-FR")}</div>
      <div class="kpi-sub">toutes unités</div>
    </div>
    <div class="kpi">
      <div class="kpi-lbl">Valeur totale</div>
      <div class="kpi-val" style="font-size:14px">${fmtFCFA(valeurTotale)}</div>
      <div class="kpi-sub">payé + reste</div>
    </div>
    <div class="kpi ok">
      <div class="kpi-lbl">Disponibles</div>
      <div class="kpi-val">${nbDisponibles}</div>
      <div class="kpi-sub">au-dessus du seuil</div>
    </div>
    <div class="kpi${nbFaible > 0 ? " alert" : ""}">
      <div class="kpi-lbl">Sous seuil</div>
      <div class="kpi-val">${nbFaible}</div>
      <div class="kpi-sub">à réapprovisionner</div>
    </div>
  </div>

  <div class="tbl-outer">
    <div class="tbl-wrap">
      <table>
        <thead class="tbl-head">
          <tr>
            <th>#</th>
            <th>Marchandise</th>
            <th class="num">Qté</th>
            <th class="num">Seuil</th>
            <th>Unité</th>
            <th>Dépositaire</th>
            <th>Commercial</th>
            <th class="num">Payé</th>
            <th class="num">Reste</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${
            rowsHTML ||
            `<tr><td colspan="10" style="padding:28px;text-align:center;color:#94a3b8">Aucun article à inventorier</td></tr>`
          }
        </tbody>
        <tfoot>
          <tr class="tbl-foot">
            <td colspan="7">Total général — ${sorted.length} article${sorted.length !== 1 ? "s" : ""}</td>
            <td class="amt">${fmtFCFA(sumPayee)}</td>
            <td class="amt">${fmtFCFA(sumReste)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>

  ${
    nbFaible > 0
      ? `<div class="alert-box">
    <strong>${nbFaible} article${nbFaible > 1 ? "s" : ""}</strong>
    ${nbFaible > 1 ? "sont" : "est"} sous le seuil de réapprovisionnement.
    Prioriser une commande avant rupture.
  </div>`
      : ""
  }

  <div class="signatures">
    <div class="sig-block">
      <div class="sig-label">Magasinier</div>
      <div class="sig-line">Nom &amp; visa</div>
    </div>
    <div class="sig-block">
      <div class="sig-label">Responsable entrepôt</div>
      <div class="sig-line">Nom &amp; visa</div>
    </div>
    <div class="sig-block">
      <div class="sig-label">Direction</div>
      <div class="sig-line">Visa</div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-note">
      Document confidentiel · usage interne SLTT<br>
      Inventaire généré automatiquement · © ${now.getFullYear()}
    </div>
    <div class="footer-brand">SLTT · Bamako</div>
  </div>
</div>
</body>
</html>`);
  win.document.close();
  triggerPrint(win);
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
  const logoUrl      = getLogoUrl();
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
  triggerPrint(win);
}

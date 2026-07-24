"use client";

import { requireSocieteBrand, type SocieteBrand } from "@/lib/societe-brand";
import { htmlEscape } from "../html-escape";
import {
  brandLogoImgHTML,
  buildBrandSubHTML,
  documentFooterHTML,
  triggerPrint,
  warnPopupBlocked,
} from "../print-document";
import { fmtFCFA } from "./shared";

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
  /** Société sélectionnée (filtre précis, pas "Toutes") — sert à afficher sa véritable identité légale plutôt que celle de SLTT par défaut. */
  societe?: SocieteBrand;
}

export function printStockInventory(
  rows: StockInventoryRow[],
  options: StockInventoryPrintOptions = {},
): void {
  if (!requireSocieteBrand(options.societe, "l'inventaire stock")) return;
  const societe = options.societe!;
  const logoImg = brandLogoImgHTML(societe);
  const brandSubHTML = buildBrandSubHTML(societe);
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
    warnPopupBlocked();
    return;
  }
  win.opener = null;

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
      ${logoImg}
      <div>
        ${societe.afficherNomAvecLogo === false ? "" : `<div class="brand-name">${htmlEscape(societe.nom)}</div>`}
        <div class="brand-sub">${brandSubHTML}</div>
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
      Document confidentiel · usage interne ${htmlEscape(societe.nom)}<br>
      Inventaire généré automatiquement · © ${now.getFullYear()}
    </div>
    <div class="footer-brand">${documentFooterHTML(societe.nom)}</div>
  </div>
</div>
</body>
</html>`);
  win.document.close();
  triggerPrint(win);
}

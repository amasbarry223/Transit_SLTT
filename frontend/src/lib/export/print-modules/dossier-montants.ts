import { BRAND } from "@/lib/brand-colors";
import { formatDateShort, formatFCFA } from "@/lib/format";
import { htmlEscape } from "@/lib/export/html-escape";
import {
  CATEGORIE_DEPENSE_LABELS,
  MODE_PAIEMENT_LABELS,
  STATUT_PAIEMENT_LABELS,
  type DepenseDossier,
  type FinancesDossier,
  type PaiementDossier,
} from "@/lib/domain/dossier-finances";

const POSITIF = BRAND.success;
const NEGATIF = BRAND.error;
const h2 = (titre: string) =>
  `<h2 style="margin-top:24px;font-size:14px;color:${BRAND.navy}">${htmlEscape(titre)}</h2>`;
const date = (d?: string) => (d ? formatDateShort(d) : "—");

/**
 * Bloc "Montants" des PDF de dossier (formulaire et fiche détail), au format
 * de la fiche Excel "Situation du client" : mêmes chiffres que le
 * récapitulatif, calculés par dossier-finances.ts.
 */
export function dossierMontantsHtml({
  finances: f,
  depenses = [],
  paiements = [],
}: {
  finances: FinancesDossier;
  depenses?: ReadonlyArray<DepenseDossier>;
  paiements?: ReadonlyArray<PaiementDossier>;
}): string {
  const reste =
    f.resteAPayer < 0
      ? `<tr><th>Trop-perçu</th><td class="num">${formatFCFA(-f.resteAPayer, false)}</td></tr>`
      : `<tr><th>Reste à payer</th><td class="num">${formatFCFA(f.resteAPayer, false)}</td></tr>`;

  const tablePaiements = paiements.length
    ? `${h2("Paiements du client")}
      <table>
        <thead><tr><th>Date</th><th>Mode</th><th>Réf.</th><th class="num">Montant</th></tr></thead>
        <tbody>
          ${paiements
            .map(
              (p) => `<tr><td>${date(p.date)}</td><td>${htmlEscape(MODE_PAIEMENT_LABELS[p.mode] ?? p.mode ?? "—")}</td>` +
                `<td>${htmlEscape(p.reference ?? "") || "—"}</td><td class="num">${formatFCFA(p.montant, false)}</td></tr>`,
            )
            .join("")}
          <tr class="total-row"><th colspan="3">Montant payé</th><td class="num">${formatFCFA(f.montantPaye, false)}</td></tr>
        </tbody>
      </table>`
    : "";

  const tableDepenses = depenses.length
    ? `${h2("Dépenses")}
      <table>
        <thead><tr><th>Date</th><th>Nature</th><th>Catégorie</th><th class="num">Montant</th></tr></thead>
        <tbody>
          ${depenses
            .map(
              (d) => `<tr><td>${date(d.date)}</td><td>${htmlEscape(d.nature)}</td>` +
                `<td>${htmlEscape(CATEGORIE_DEPENSE_LABELS[d.categorie] ?? d.categorie ?? "—")}</td><td class="num">${formatFCFA(d.montant, false)}</td></tr>`,
            )
            .join("")}
          <tr class="total-row"><th colspan="3">Total dépenses</th><td class="num">${formatFCFA(f.totalDepenses, false)}</td></tr>
        </tbody>
      </table>`
    : "";

  return `
      ${h2("Montants (FCFA)")}
      <table>
        <tbody>
          <tr><th style="width:35%">Total contrat</th><td class="num">${formatFCFA(f.totalContrat, false)}</td></tr>
          <tr><th>Montant payé</th><td class="num">${formatFCFA(f.montantPaye, false)}</td></tr>
          ${reste}
          <tr><th>Dépenses</th><td class="num">${formatFCFA(f.totalDepenses, false)}</td></tr>
          <tr><th>Statut du paiement</th><td>${htmlEscape(STATUT_PAIEMENT_LABELS[f.statutPaiement] ?? f.statutPaiement ?? "—")}</td></tr>
          <tr class="total-row">
            <th>Bénéfice net</th>
            <td class="num" style="color:${f.beneficeNet >= 0 ? POSITIF : NEGATIF}">
              ${formatFCFA(f.beneficeNet, false)}${f.perte ? " — PERTE" : ""}
            </td>
          </tr>
        </tbody>
      </table>
      ${tablePaiements}
      ${tableDepenses}`;
}

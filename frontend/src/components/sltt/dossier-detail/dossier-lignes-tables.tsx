"use client";

import type { Dossier } from "@/lib/domain-types";
import { formatDateShort, formatFCFA } from "@/lib/format";
import { CATEGORIE_DEPENSE_LABELS, MODE_PAIEMENT_LABELS } from "@/lib/domain/dossier-finances";
import { cn } from "@/shared/utils/cn";

/** Tables en lecture seule des paiements du client et des dépenses d'un dossier. */
export function DossierLignesTables({ dossier, className }: { dossier: Dossier; className?: string }) {
  const paiements = dossier.paiements ?? [];
  const depenses = dossier.depenses ?? [];
  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      <LignesTable
        titre="Paiements du client"
        vide="Aucun paiement."
        colonnes={["Date", "Mode", "Réf."]}
        lignes={paiements.map((p) => ({
          key: p.id ?? `${p.date}-${p.montant}`,
          cellules: [formatDateShort(p.date), MODE_PAIEMENT_LABELS[p.mode] ?? p.mode ?? "—", p.reference || "—"],
          montant: p.montant,
        }))}
      />
      <LignesTable
        titre="Dépenses"
        vide="Aucune dépense."
        colonnes={["Date", "Nature", "Catégorie"]}
        lignes={depenses.map((d) => ({
          key: d.id ?? `${d.date}-${d.nature}-${d.montant}`,
          cellules: [formatDateShort(d.date), d.nature, CATEGORIE_DEPENSE_LABELS[d.categorie] ?? d.categorie ?? "—"],
          montant: d.montant,
        }))}
      />
    </div>
  );
}

function LignesTable({
  titre,
  vide,
  colonnes,
  lignes,
}: {
  titre: string;
  vide: string;
  colonnes: [string, string, string];
  lignes: { key: string; cellules: string[]; montant: number }[];
}) {
  const total = lignes.reduce((s, l) => s + l.montant, 0);
  return (
    <div className="min-w-0">
      <h3 className="mb-2 text-sm font-semibold text-foreground">{titre}</h3>
      {lignes.length === 0 ? (
        <p className="text-xs text-muted-foreground">{vide}</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                {colonnes.map((c) => (
                  <th key={c} className="px-2 py-1.5 text-left font-medium">
                    {c}
                  </th>
                ))}
                <th className="px-2 py-1.5 text-right font-medium">Montant</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.key} className="border-t border-border">
                  {l.cellules.map((c, i) => (
                    <td key={i} className="px-2 py-1.5">
                      {c}
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-right tabular-nums">{formatFCFA(l.montant)}</td>
                </tr>
              ))}
              <tr className="border-t border-border bg-muted/40 font-semibold">
                <td className="px-2 py-1.5" colSpan={3}>
                  Total
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">{formatFCFA(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

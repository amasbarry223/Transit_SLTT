"use client";

import { RecuGeneratorActions } from "./recus-paiement/recu-generator-actions";
import { RecuReceiptPreview } from "./recus-paiement/recu-receipt-preview";
import { RecuWorkspace } from "./recus-paiement/recu-workspace";
import { useRecuGenerator } from "./recus-paiement/use-recu-generator";

const BLANK_MODULE_DATA = { reference: "" };

/**
 * Carnet de reçus vierges — plus de saisie sur la plateforme : on réserve
 * juste le(s) prochain(s) numéro(s) (auto-généré, jamais dupliqué, un seul
 * clic peut en réserver plusieurs) et on imprime un carnet vierge à remplir
 * au stylo. Voir use-recu-generator.ts.
 */
export function RecusPaiementScreen() {
  const gen = useRecuGenerator();

  return (
    <>
      {/* Desktop: workspace plein écran, sans scroll */}
      <div className="hidden h-full min-h-0 lg:block">
        <RecuWorkspace
          current={gen.current}
          batchSize={gen.batchSize}
          brand={gen.brand}
          canWrite={gen.canWrite}
          count={gen.count}
          onCountChange={gen.setCount}
          generating={gen.generating}
          printing={gen.printing}
          onGenerate={gen.handleGenerate}
          onPrint={gen.handlePrint}
        />
      </div>

      {/* Mobile: aperçu + actions empilés, page scrollable */}
      <div className="space-y-4 pb-8 lg:hidden">
        <RecuReceiptPreview
          data={gen.current?.moduleData ?? BLANK_MODULE_DATA}
          brand={gen.brand}
          reference={gen.current?.reference}
          className={gen.current ? undefined : "opacity-60"}
        />
        {gen.batchSize > 1 && (
          <p className="text-center text-[11px] text-muted-foreground">
            Aperçu du dernier reçu du lot ({gen.batchSize} reçus identiques, numéros différents)
          </p>
        )}

        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
          <RecuGeneratorActions
            canWrite={gen.canWrite}
            hasCurrent={!!gen.current}
            count={gen.count}
            onCountChange={gen.setCount}
            generating={gen.generating}
            printing={gen.printing}
            onGenerate={gen.handleGenerate}
            onPrint={gen.handlePrint}
          />
        </div>
      </div>
    </>
  );
}

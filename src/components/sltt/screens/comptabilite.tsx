"use client";

import { useState } from "react";
import { FileSpreadsheet, FileUp, Plus, ScanLine } from "lucide-react";
import { PageHeader } from "@/components/sltt/page-header";
import { JournalCaissePanel } from "@/components/sltt/comptabilite-generale/journal-caisse-panel";
import { useComptabiliteGeneraleScreen } from "@/components/sltt/comptabilite-generale/use-comptabilite-generale-screen";
import { Button } from "@/components/ui/button";

export function ComptabiliteScreen() {
  const [importOpen, setImportOpen] = useState(false);
  const journalScreen = useComptabiliteGeneraleScreen();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comptabilité générale & caisse"
        description="Journal unique des opérations financières et règlements dossiers par entité (Annexe Mali, Annexe CI, Top Doumani)."
      >
        <Button
          variant="outline"
          onClick={journalScreen.exportExcel}
          disabled={journalScreen.totalItems === 0}
          title="Exporter en Excel"
        >
          <FileSpreadsheet className="size-4" />
          <span className="hidden sm:inline">Exporter Excel</span>
        </Button>
        {journalScreen.canWrite && (
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileUp className="size-4" />
              <span className="hidden sm:inline">Importer un document</span>
            </Button>
            <Button variant="outline" onClick={() => journalScreen.setClotureOpen(true)}>
              <ScanLine className="size-4" />
              <span className="hidden sm:inline">Clôturer la caisse</span>
            </Button>
            <Button onClick={() => journalScreen.setFormOpen(true)}>
              <Plus className="size-4" />
              Nouvelle opération
            </Button>
          </>
        )}
      </PageHeader>

      <JournalCaissePanel screen={journalScreen} importOpen={importOpen} setImportOpen={setImportOpen} />
    </div>
  );
}

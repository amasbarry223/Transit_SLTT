"use client";

import { useState } from "react";
import { FileSpreadsheet, FileUp, Plus, ScanLine } from "lucide-react";
import { PageHeader } from "@/components/sltt/page-header";
import { EcrituresPanel } from "@/components/sltt/comptabilite/ecritures-panel";
import { useEcrituresScreen } from "@/components/sltt/comptabilite/use-ecritures-screen";
import { JournalCaissePanel } from "@/components/sltt/comptabilite-generale/journal-caisse-panel";
import { useComptabiliteGeneraleScreen } from "@/components/sltt/comptabilite-generale/use-comptabilite-generale-screen";
import { useBeneficeParSociete } from "@/hooks/use-benefice-par-societe";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ComptabiliteTab = "ecritures" | "journal";

export function ComptabiliteScreen() {
  const [activeTab, setActiveTab] = useState<ComptabiliteTab>("ecritures");
  const [importOpen, setImportOpen] = useState(false);

  const ecrituresScreen = useEcrituresScreen();
  const journalScreen = useComptabiliteGeneraleScreen();
  const benefice = useBeneficeParSociete();

  const tabMeta = {
    ecritures: {
      description: "Suivi des paiements liés aux dossiers de transit et entreposage, par société.",
    },
    journal: {
      description: "Journal de caisse par entité — Annexe Mali, Annexe Côte d'Ivoire, Société Top Doumani.",
    },
  } as const;

  const currentTab = tabMeta[activeTab];

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ComptabiliteTab)}
        className="gap-5"
      >
        <PageHeader title="Comptabilité" description={currentTab.description}>
          {activeTab === "ecritures" ? (
            <>
              <Button
                variant="outline"
                onClick={ecrituresScreen.exportExcel}
                disabled={ecrituresScreen.filtered.length === 0}
                title="Exporter en Excel"
                aria-label="Exporter en Excel"
              >
                <FileSpreadsheet className="size-4" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
              {ecrituresScreen.canWrite && (
                <Button onClick={ecrituresScreen.openNewEcriture}>
                  <Plus className="size-4" />
                  Nouvelle écriture
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={journalScreen.exportExcel}
                disabled={journalScreen.totalItems === 0}
                title="Exporter en Excel"
              >
                <FileSpreadsheet className="size-4" />
                <span className="hidden sm:inline">Excel</span>
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
            </>
          )}
        </PageHeader>

        <TabsList className="h-10 flex-wrap">
          <TabsTrigger value="ecritures">Écritures dossiers</TabsTrigger>
          <TabsTrigger value="journal">Journal de caisse</TabsTrigger>
        </TabsList>

        <EcrituresPanel screen={ecrituresScreen} benefice={benefice} />
        <JournalCaissePanel screen={journalScreen} importOpen={importOpen} setImportOpen={setImportOpen} />
      </Tabs>
    </div>
  );
}

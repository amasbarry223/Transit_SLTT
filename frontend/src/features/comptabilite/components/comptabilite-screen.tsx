"use client";

import { useState } from "react";
import { BookOpen, FileSpreadsheet, FileUp, Plus, ScanLine, Users } from "lucide-react";
import { PageHeader } from "@/components/sltt/page-header";
import { useStore } from "@/lib/store";
import { JournalCaissePanel } from "./comptabilite-generale/journal-caisse-panel";
import { SituationClientsPanel } from "./comptabilite-generale/situation-clients-panel";
import { useComptabiliteGeneraleScreen } from "./comptabilite-generale/use-comptabilite-generale-screen";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/utils/cn";

const COMPTA_TABS = [
  { key: "journal" as const, label: "Journal de caisse", shortLabel: "Journal", icon: BookOpen },
  { key: "clients" as const, label: "Situation des clients", shortLabel: "Clients", icon: Users },
];

export function ComptabiliteScreen() {
  const [activeTab, setActiveTab] = useState<"journal" | "clients">("journal");
  const [importOpen, setImportOpen] = useState(false);
  const journalScreen = useComptabiliteGeneraleScreen();
  const clientsCount = useStore((s) => s.clients.length);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comptabilité générale & caisse"
        description="Journal unique des opérations financières, situation financière des clients et règlements par entité (Annexe Mali, Annexe CI)."
      >
        {activeTab === "journal" && (
          <Button
            variant="outline"
            onClick={journalScreen.exportExcel}
            disabled={journalScreen.totalItems === 0}
            title="Exporter en Excel"
          >
            <FileSpreadsheet className="size-4" />
            <span className="hidden sm:inline">Exporter Excel</span>
          </Button>
        )}
        {activeTab === "journal" && journalScreen.canWrite && (
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileUp className="size-4" />
              <span className="hidden sm:inline">Importer un document</span>
            </Button>
            <Button variant="outline" onClick={() => journalScreen.setClotureOpen(true)}>
              <ScanLine className="size-4" />
              <span className="hidden sm:inline">Clôturer la caisse</span>
            </Button>
            <Button
              onClick={() => journalScreen.setFormOpen(true)}
              className="bg-[#ED1C24] hover:bg-[#D9161E] text-white font-bold px-5 h-10 rounded-xl shadow-lg shadow-red-600/25 border border-red-500/40 gap-2 transition-all"
            >
              <Plus className="size-4" />
              Nouvelle opération
            </Button>
          </>
        )}
      </PageHeader>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "journal" | "clients")} className="gap-0">
        <div className="sticky top-16 z-10 -mx-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <TabsList className="flex h-12 w-fit items-stretch gap-1 rounded-none bg-transparent p-0">
            {COMPTA_TABS.map((t) => {
              const Icon = t.icon;
              const count = t.key === "journal" ? journalScreen.totalItems : clientsCount;
              return (
                <TabsTrigger
                  key={t.key}
                  value={t.key}
                  className={cn(
                    "group relative flex items-center justify-center gap-2 rounded-none border-0 border-b-2 border-transparent bg-transparent px-4 py-0",
                    "text-sm font-medium text-muted-foreground shadow-none transition-colors",
                    "hover:text-foreground",
                    "data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none",
                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                    "[&[data-state=active]_svg]:text-primary",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">{t.shortLabel}</span>
                  <span className="ml-0.5 rounded-full bg-muted px-1.5 text-[10px] font-semibold tabular-nums text-muted-foreground transition-colors group-data-[state=active]:bg-primary/10 group-data-[state=active]:text-primary">
                    {count}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="journal" className="mt-6">
          <JournalCaissePanel screen={journalScreen} importOpen={importOpen} setImportOpen={setImportOpen} />
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          <SituationClientsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

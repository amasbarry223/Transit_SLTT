"use client";

import { useUiPrefs } from "@/lib/session/ui-prefs-store";

import { useMemo, useState } from "react";
import {
  Package,
  Plus,
  Wallet,
  ArrowLeftRight,
  AlertTriangle,
  History,
} from "lucide-react";

import { useStore } from "@/lib/store";
import type { StockItem } from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import { formatFCFA, parseLocalDate } from "@/lib/format";
import { getDashboardAnchorDate } from "@/lib/calendar-anchor";
import { exportToExcel, printStockInventory } from "@/lib/export";
import { resolveSlttBrand, societeToBrand } from "@/lib/societe-brand";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastInfo, toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { UI } from "@/lib/ui-messages";
import { usePermission } from "@/hooks/use-permission";
import { useActiveAnnexe } from "@/hooks/use-active-annexe";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { filterBySociete } from "@/lib/filter-by-societe";
import { filterByAnnexe } from "@/lib/filter-by-annexe";
import { StockTab } from "./entreposage/stock-tab";
import { MouvementsTab } from "./entreposage/mouvements-tab";
import { EntryExitDialogs } from "./entreposage/entry-exit-dialogs";
import { NewItemDialog } from "./entreposage/new-item-dialog";
import { useStockMovementDialogs } from "./entreposage/use-stock-movement-dialogs";

type EntrepotTab = "stock" | "mouvements";

const tabs: {
  key: EntrepotTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "stock", label: "Inventaire", shortLabel: "Stock", icon: Package },
  {
    key: "mouvements",
    label: "Historique des mouvements",
    shortLabel: "Mouvements",
    icon: History,
  },
];

export function EntreposageScreen() {
  const { toast } = useToast();
  const openClient = useNav((s) => s.openClient);
  const canWrite = usePermission("stock:write");
  const allStock = useStore((s) => s.stock);
  const clients = useStore((s) => s.clients);
  const allMouvements = useStore((s) => s.mouvements);
  const societes = useStore((s) => s.societes);
  const addStockItem = useStore((s) => s.addStockItem);
  const selectedSocieteId = useUiPrefs((s) => s.selectedSocieteId);
  const { annexes, activeAnnexeId, selectedAnnexeId } = useActiveAnnexe();

  const stock = useMemo(
    () => filterByAnnexe(filterBySociete(allStock, selectedSocieteId), selectedAnnexeId),
    [allStock, selectedSocieteId, selectedAnnexeId],
  );
  const mouvements = useMemo(
    () => filterByAnnexe(filterBySociete(allMouvements, selectedSocieteId), selectedAnnexeId),
    [allMouvements, selectedSocieteId, selectedAnnexeId],
  );

  const dialogs = useStockMovementDialogs(stock);

  const [newItemOpen, setNewItemOpen] = useState(false);
  const [newItemKey, setNewItemKey] = useState(0);

  function openNewItemDialog() {
    setNewItemKey((k) => k + 1);
    setNewItemOpen(true);
  }

  const [activeTab, setActiveTab] = useState<EntrepotTab>("stock");
  const [marchandiseFilter, setMarchandiseFilter] = useState("");
  const [stockIdFilter, setStockIdFilter] = useState("");

  const articlesEnStock = stock.length;
  const valeurStock = stock.reduce(
    (acc, s) => acc + s.sommePayee + s.resteAPayer,
    0,
  );
  const mouvementsCeMois = useMemo(() => {
    const anchor = getDashboardAnchorDate();
    return mouvements.filter((m) => {
      const d = parseLocalDate(m.date);
      return d.getFullYear() === anchor.getFullYear() && d.getMonth() === anchor.getMonth();
    }).length;
  }, [mouvements]);
  const alertesStockFaible = stock.filter((s) => s.quantite < s.seuil).length;

  function goToHistory(stockId: string, marchandise: string) {
    setStockIdFilter(stockId);
    setMarchandiseFilter(marchandise);
    setActiveTab("mouvements");
    toastInfo(toast, {
      title: `Historique — ${marchandise}`,
      description: "Mouvements filtrés pour cette marchandise.",
    });
  }

  async function handleExportStockExcel(rows: StockItem[]) {
    if (rows.length === 0) {
      toastWarning(toast, {
        title: "Rien à exporter",
        description: UI.errors.exportEmpty,
      });
      return;
    }
    try {
      await exportToExcel(
        "stock",
        `inventaire-stock-${new Date().toISOString().slice(0, 10)}`,
        [
          { header: "Marchandise", accessor: (s) => s.marchandise },
          { header: "Société", accessor: (s) => s.societeNom },
          { header: "Quantité disponible", accessor: (s) => s.quantite },
          { header: "Unité", accessor: (s) => s.unite },
          { header: "Seuil", accessor: (s) => s.seuil },
          { header: "Dépositaire", accessor: (s) => s.depositaire },
          { header: "Commercial", accessor: (s) => s.commercial },
          { header: "Somme payée (FCFA)", accessor: (s) => s.sommePayee },
          { header: "Reste à payer (FCFA)", accessor: (s) => s.resteAPayer },
          {
            header: "Statut",
            accessor: (s) => (s.quantite < s.seuil ? "Stock faible" : "Disponible"),
          },
        ],
        rows,
        { module: "Stock" },
      );
    } catch (error) {
      toastError(toast, error, {
        title: "Impossible d'exporter l'inventaire",
        fallback: UI.errors.exportFailed,
      });
      return;
    }
    toastSuccess(toast, {
      title: "Inventaire exporté",
      description: `${rows.length} article${rows.length !== 1 ? "s" : ""} exporté${rows.length !== 1 ? "s" : ""}.`,
    });
  }

  // Reçoit les lignes réellement visibles dans StockTab (après sa recherche
  // locale) plutôt que tout le stock de la société — sans ça, imprimer/
  // exporter pendant qu'une recherche est active produit un document qui ne
  // correspond pas à ce que l'utilisateur a sous les yeux.
  //
  // Regroupées par société plutôt qu'un unique en-tête pour tout le document :
  // sans filtre société actif, `rows` peut mélanger Top Doumani et SLTT — un
  // en-tête unique ferait imprimer les articles d'une société sous le logo/
  // l'identité légale d'une autre. Chaque groupe devient sa propre section
  // (son propre logo, ses propres totaux) dans printStockInventory.
  function handlePrintStock(rows: StockItem[]) {
    const bySociete = new Map<string, StockItem[]>();
    for (const item of rows) {
      const list = bySociete.get(item.societeId) ?? [];
      list.push(item);
      bySociete.set(item.societeId, list);
    }

    const groups = Array.from(bySociete.entries())
      .map(([societeId, items]) => {
        const societeRow = societes.find((s) => s.id === societeId);
        if (!societeRow) return null;
        return {
          societe: societeToBrand(societeRow),
          rows: items.map((s) => ({
            marchandise: s.marchandise,
            quantite: s.quantite,
            seuil: s.seuil,
            unite: s.unite,
            depositaire: s.depositaire,
            commercial: s.commercial,
            sommePayee: s.sommePayee,
            resteAPayer: s.resteAPayer,
            clientNom: s.clientNom,
          })),
        };
      })
      .filter((g): g is NonNullable<typeof g> => g !== null)
      .sort((a, b) => a.societe.nom.localeCompare(b.societe.nom, "fr"));

    if (groups.length === 0) {
      const fallback = resolveSlttBrand(societes);
      printStockInventory(fallback ? [{ societe: fallback, rows: [] }] : []);
      return;
    }

    printStockInventory(groups);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entreposage"
        description="Gestion du stock et des mouvements"
      >
        {canWrite && (
          <Button onClick={openNewItemDialog}>
            <Plus className="size-4" />
            Nouvel article
          </Button>
        )}
      </PageHeader>

      {alertesStockFaible > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200/80 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/30 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-900 dark:text-red-200">
              {alertesStockFaible} article{alertesStockFaible > 1 ? "s" : ""} en
              stock faible
            </p>
            <p className="mt-0.5 text-xs text-red-700 dark:text-red-300/80">
              Pensez à réapprovisionner ou à enregistrer une entrée de marchandise.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Articles en stock"
          value={String(articlesEnStock)}
          icon={Package}
          tone="blue"
          sublabel="références distinctes"
        />
        <KpiCard
          label="Valeur du stock"
          value={formatFCFA(valeurStock)}
          icon={Wallet}
          tone="indigo"
          sublabel="valeur totale"
        />
        <KpiCard
          label="Mouvements ce mois"
          value={String(mouvementsCeMois)}
          icon={ArrowLeftRight}
          tone="emerald"
          sublabel="entrées et sorties"
        />
        <KpiCard
          label="Alertes stock faible"
          value={String(alertesStockFaible)}
          icon={AlertTriangle}
          tone="red"
          sublabel="à réapprovisionner"
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as EntrepotTab)}
        className="gap-0"
      >
        <div className="sticky top-0 z-10 -mx-1 bg-background/95 px-1 pb-0 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <TabsList
            className={cn(
              "h-auto w-full justify-start gap-0 overflow-x-auto rounded-none bg-transparent p-0",
              "scrollbar-none [&::-webkit-scrollbar]:hidden",
            )}
          >
            {tabs.map((t) => {
              const Icon = t.icon;
              const count =
                t.key === "stock" ? stock.length : mouvements.length;
              return (
                <TabsTrigger
                  key={t.key}
                  value={t.key}
                  className={cn(
                    "relative shrink-0 rounded-none border-0 border-b-2 border-transparent bg-transparent px-4 py-3",
                    "text-sm font-medium text-muted-foreground shadow-none transition-colors",
                    "hover:text-slate-900 dark:hover:text-slate-100 data-[state=active]:border-primary data-[state=active]:bg-transparent",
                    "data-[state=active]:text-primary data-[state=active]:shadow-none",
                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                    "[&[data-state=active]_svg]:text-primary",
                  )}
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">{t.shortLabel}</span>
                  <span className="ml-1.5 rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          <Separator />
        </div>

        <TabsContent value="stock" className="mt-6 focus-visible:outline-none">
          <StockTab
            stock={stock}
            onEntry={dialogs.openEntry}
            onExit={dialogs.openExit}
            onHistory={goToHistory}
            onPrint={handlePrintStock}
            onExport={handleExportStockExcel}
            canWrite={canWrite}
            onCreateItem={openNewItemDialog}
            onOpenClient={openClient}
          />
        </TabsContent>

        <TabsContent value="mouvements" className="mt-6 focus-visible:outline-none">
          <MouvementsTab
            key={stockIdFilter || marchandiseFilter}
            mouvements={mouvements}
            marchandiseFilter={marchandiseFilter}
            stockIdFilter={stockIdFilter}
            onClearMarchandiseFilter={() => { setMarchandiseFilter(""); setStockIdFilter(""); }}
          />
        </TabsContent>
      </Tabs>

      <EntryExitDialogs stock={stock} dialogs={dialogs} />

      <NewItemDialog
        key={newItemKey}
        open={newItemOpen}
        onOpenChange={setNewItemOpen}
        societes={societes}
        annexes={annexes}
        clients={clients}
        defaultSocieteId={selectedSocieteId ?? societes[0]?.id ?? ""}
        defaultAnnexeId={activeAnnexeId ?? ""}
        onSubmit={async (input) => {
          try {
            await addStockItem(input);
          } catch (error) {
            toastError(toast, error, {
              title: "Impossible d'ajouter l'article au stock",
              fallback: UI.errors.saveFailed,
            });
            return;
          }
          toastSuccess(toast, { title: "Article ajouté", description: `${input.marchandise} ajouté au stock.` });
          setNewItemOpen(false);
        }}
      />
    </div>
  );
}

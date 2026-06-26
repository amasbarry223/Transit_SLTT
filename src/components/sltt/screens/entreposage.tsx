"use client";

import { useState } from "react";
import {
  Package,
  PackagePlus,
  PackageMinus,
  Wallet,
  ArrowLeftRight,
  AlertTriangle,
  History,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";

import { stock, mouvements, type StockItem } from "@/lib/mock-data";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { ToneBadge, StockStatutBadge } from "@/components/sltt/status-badge";
import { useToast } from "@/hooks/use-toast";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function EntreposageScreen() {
  const { toast } = useToast();

  const articlesEnStock = stock.length;
  const valeurStock = stock.reduce(
    (acc, s) => acc + s.sommePayee + s.resteAPayer,
    0,
  );
  const mouvementsCeMois = mouvements.length;
  const alertesStockFaible = stock.filter((s) => s.quantite < s.seuil).length;

  function notifyEntree() {
    toast({
      title: "Entrée de marchandise",
      description: "Formulaire d'entrée de marchandise (démo).",
    });
  }

  function notifySortie() {
    toast({
      title: "Sortie de marchandise",
      description: "Formulaire de sortie de marchandise (démo).",
    });
  }

  function notifyAction(titre: string) {
    toast({ title: titre, description: "Action visuelle (démo)." });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entreposage"
        description="Gestion du stock et des mouvements"
      >
        <Button
          variant="outline"
          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          onClick={notifyEntree}
        >
          <PackagePlus className="size-4" />
          Entrée de marchandise
        </Button>
        <Button
          variant="outline"
          className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
          onClick={notifySortie}
        >
          <PackageMinus className="size-4" />
          Sortie
        </Button>
      </PageHeader>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Articles en stock"
          value={String(articlesEnStock)}
          icon={Package}
          tone="blue"
          sublabel="Références distinctes"
        />
        <KpiCard
          label="Valeur du stock"
          value={formatFCFA(valeurStock)}
          icon={Wallet}
          tone="indigo"
          sublabel="Valeur totale"
        />
        <KpiCard
          label="Mouvements ce mois"
          value={String(mouvementsCeMois)}
          icon={ArrowLeftRight}
          tone="emerald"
          sublabel="Entrées et sorties"
        />
        <KpiCard
          label="Alertes stock faible"
          value={String(alertesStockFaible)}
          icon={AlertTriangle}
          tone="red"
          sublabel="À réapprovisionner"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="mouvements">Historique des mouvements</TabsTrigger>
        </TabsList>

        {/* Tab: Stock */}
        <TabsContent value="stock">
          <Card className="p-0 shadow-sm border-border/80 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-border">
                  <TableHead className="text-xs uppercase text-slate-500 font-medium">
                    Marchandise
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium text-right">
                    Quantité disponible
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium">
                    Unité
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium">
                    Dépositaire
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium">
                    Commercial rattaché
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium text-right">
                    Somme payée
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium text-right">
                    Reste à payer
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium">
                    Statut stock
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.map((item) => (
                  <StockRow
                    key={item.id}
                    item={item}
                    onAction={notifyAction}
                  />
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tab: Mouvements */}
        <TabsContent value="mouvements">
          <Card className="p-0 shadow-sm border-border/80 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-border">
                  <TableHead className="text-xs uppercase text-slate-500 font-medium">
                    Date
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium">
                    Type
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium">
                    Marchandise
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium text-right">
                    Quantité
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium">
                    Responsable
                  </TableHead>
                  <TableHead className="text-xs uppercase text-slate-500 font-medium">
                    Bon lié
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mouvements.map((m) => {
                  const isEntree = m.type === "Entrée";
                  const hasBon = m.bonRef && m.bonRef !== "—";
                  return (
                    <TableRow
                      key={m.id}
                      className="hover:bg-slate-50/60 border-b border-border"
                    >
                      <TableCell className="text-slate-600 tabular-nums">
                        {formatDateShort(m.date)}
                      </TableCell>
                      <TableCell>
                        <ToneBadge
                          tone={isEntree ? "emerald" : "amber"}
                          dot={false}
                          className="gap-1"
                        >
                          {isEntree ? (
                            <ArrowDownToLine className="size-3" />
                          ) : (
                            <ArrowUpFromLine className="size-3" />
                          )}
                          {m.type}
                        </ToneBadge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {m.marchandise}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-slate-700">
                        {m.quantite} {m.unite}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {m.responsable}
                      </TableCell>
                      <TableCell>
                        {hasBon ? (
                          <span className="text-primary text-xs font-mono hover:underline cursor-pointer">
                            {m.bonRef}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StockRow({
  item,
  onAction,
}: {
  item: StockItem;
  onAction: (titre: string) => void;
}) {
  const faible = item.quantite < item.seuil;
  const statut = faible ? "Stock faible" : "Disponible";

  return (
    <TableRow
      className={
        "border-b border-border hover:bg-slate-50/60 " +
        (faible ? "bg-red-50/40" : "")
      }
    >
      <TableCell className="font-medium text-slate-900">
        <span className="flex items-center gap-1.5">
          {faible && (
            <AlertTriangle className="size-3.5 text-red-500 shrink-0" />
          )}
          {item.marchandise}
        </span>
      </TableCell>
      <TableCell className="text-right tabular-nums text-slate-900">
        {item.quantite} {item.unite}
      </TableCell>
      <TableCell className="text-slate-600">{item.unite}</TableCell>
      <TableCell className="text-slate-600">{item.depositaire}</TableCell>
      <TableCell className="text-slate-600">{item.commercial}</TableCell>
      <TableCell className="text-right tabular-nums text-slate-700">
        {formatFCFA(item.sommePayee)}
      </TableCell>
      <TableCell className="text-right tabular-nums text-amber-600">
        {formatFCFA(item.resteAPayer)}
      </TableCell>
      <TableCell>
        <StockStatutBadge statut={statut} />
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
            aria-label="Entrée de marchandise"
            onClick={() =>
              onAction(`Entrée — ${item.marchandise}`)
            }
          >
            <PackagePlus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
            aria-label="Sortie de marchandise"
            onClick={() =>
              onAction(`Sortie — ${item.marchandise}`)
            }
          >
            <PackageMinus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Historique"
            onClick={() =>
              onAction(`Historique — ${item.marchandise}`)
            }
          >
            <History className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

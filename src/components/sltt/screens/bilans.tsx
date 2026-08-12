"use client";

import { Wallet, Clock, TrendingUp, Percent, FileText, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/sltt/page-header";
import { KpiCard } from "@/components/sltt/kpi-card";
import { SocieteFilterSelect } from "@/components/sltt/societe-filter-select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatFCFA } from "@/lib/format";
import { EvolutionChartCard } from "@/components/sltt/bilans/evolution-chart-card";
import { RecapClientCard } from "@/components/sltt/bilans/recap-client-card";
import { RepartitionCard } from "@/components/sltt/bilans/repartition-card";
import { useBilansScreen } from "@/components/sltt/bilans/use-bilans-screen";
import { PERIODES, type Periode } from "@/components/sltt/bilans/shared";

export function BilansScreen() {
  const screen = useBilansScreen();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bilans périodiques"
        description="Analyse financière par période, basée sur les écritures comptables (hors module Factures)"
      >
        <Button
          variant="outline"
          onClick={screen.handleExportPDF}
          disabled={!screen.hasData}
          title="Exporter en PDF"
          aria-label="Exporter en PDF"
        >
          <FileText className="size-4" />
          <span className="hidden sm:inline">PDF</span>
        </Button>
        <Button
          variant="outline"
          onClick={screen.handleExportExcel}
          disabled={!screen.hasData}
          title="Exporter en Excel"
          aria-label="Exporter en Excel"
        >
          <FileSpreadsheet className="size-4" />
          <span className="hidden sm:inline">Excel</span>
        </Button>
      </PageHeader>

      {/* Period selector */}
      <Card className="p-4 shadow-sm border-border/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={screen.periode} onValueChange={(v) => screen.setPeriode(v as Periode)}>
            <TabsList>
              {PERIODES.map((p) => (
                <TabsTrigger key={p.value} value={p.value}>
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Mois de référence :</span>
            <Input
              type="month"
              value={screen.mois}
              onChange={(e) => screen.setMois(e.target.value)}
              className="w-44"
            />
            <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
              {screen.periodeLabel}
            </span>
            <SocieteFilterSelect className="w-full sm:w-44" />
          </div>
        </div>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total investi"
          value={formatFCFA(screen.recapTotaux.investi)}
          icon={TrendingUp}
          tone="blue"
          sublabel={screen.periodeLabel}
        />
        <KpiCard
          label="Total encaissé"
          value={formatFCFA(screen.recapTotaux.encaisse)}
          icon={Wallet}
          tone="emerald"
          sublabel={screen.periodeLabel}
        />
        <KpiCard
          label="Total dû"
          value={formatFCFA(screen.recapTotaux.reste)}
          icon={Clock}
          tone="amber"
          sublabel={screen.periodeLabel}
        />
        <KpiCard
          label="Taux de recouvrement"
          value={`${screen.tauxRecouvrement} %`}
          icon={Percent}
          tone={
            screen.recapTotaux.investi === 0
              ? "blue"
              : screen.tauxRecouvrement >= 80
              ? "emerald"
              : screen.tauxRecouvrement >= 50
              ? "amber"
              : "red"
          }
          sublabel={screen.periodeLabel}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Bénéfice entreposage — {screen.beneficeMoisLabel}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            label="Toutes sociétés"
            value={formatFCFA(screen.consolide.benefice)}
            icon={TrendingUp}
            tone={screen.consolide.benefice >= 0 ? "emerald" : "red"}
            sublabel="Recettes − Dépenses, consolidé"
            tooltip={`Recettes = écritures + paiements factures du mois de référence. Dépenses = dépenses de contrats du mois. Consolidé = somme de toutes les sociétés (${screen.nbSocietes}) + activité non affectée (transit).`}
          />
          {screen.parSociete.map(({ societe, benefice: b }) => (
            <KpiCard
              key={societe.id}
              label={societe.nom}
              value={formatFCFA(b)}
              icon={TrendingUp}
              tone={b >= 0 ? "emerald" : "red"}
              sublabel="bénéfice du mois"
            />
          ))}
        </div>
      </div>

      {screen.isMultiAnnexe && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Vue consolidée par annexe — {screen.beneficeMoisLabel}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard
              label="Toutes annexes"
              value={formatFCFA(screen.beneficeAnnexe.consolide.benefice)}
              icon={TrendingUp}
              tone={screen.beneficeAnnexe.consolide.benefice >= 0 ? "emerald" : "red"}
              sublabel="Recettes − sorties de caisse, consolidé"
              tooltip="Recettes = écritures + paiements factures du mois de référence, toutes annexes confondues. Réservé aux comptes ayant accès à plusieurs annexes."
            />
            {screen.beneficeAnnexe.parAnnexe.map(({ annexe, benefice: b }) => (
              <KpiCard
                key={annexe.id}
                label={annexe.nom}
                value={formatFCFA(b)}
                icon={TrendingUp}
                tone={b >= 0 ? "emerald" : "red"}
                sublabel="bénéfice du mois"
              />
            ))}
          </div>
        </div>
      )}

      <EvolutionChartCard chartData={screen.chartData} mois={screen.mois} />

      {/* Recap table + Pie */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RecapClientCard
          sortedRecap={screen.sortedRecap}
          recapTotaux={screen.recapTotaux}
          hasData={screen.hasData}
          sortKey={screen.sortKey}
          sortDir={screen.sortDir}
          onSort={screen.toggleSort}
          periodeLabel={screen.periodeLabel}
          totalClients={screen.recapParClient.length}
        />
        <RepartitionCard
          pieData={screen.pieData}
          pieTotal={screen.pieTotal}
          tauxRecouvrement={screen.tauxRecouvrement}
        />
      </div>
    </div>
  );
}

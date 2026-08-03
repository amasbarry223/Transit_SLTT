"use client";

import { FileSpreadsheet, Plus } from "lucide-react";
import { PageHeader } from "@/components/sltt/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BeneficeKpiRow } from "@/components/sltt/comptabilite/benefice-kpi-row";
import { EcrituresFilters } from "@/components/sltt/comptabilite/ecritures-filters";
import { EcrituresKpiRow } from "@/components/sltt/comptabilite/ecritures-kpi-row";
import { EcrituresTable } from "@/components/sltt/comptabilite/ecritures-table";
import { NewEcritureDialog } from "@/components/sltt/comptabilite/new-ecriture-dialog";
import { PaymentDialog } from "@/components/sltt/comptabilite/payment-dialog";
import { PaymentInfoBanner } from "@/components/sltt/comptabilite/payment-info-banner";
import { PendingAlertBanner } from "@/components/sltt/comptabilite/pending-alert-banner";
import { useEcrituresScreen } from "@/components/sltt/comptabilite/use-ecritures-screen";
import { useBeneficeParSociete } from "@/hooks/use-benefice-par-societe";

export function ComptabiliteScreen() {
  const screen = useEcrituresScreen();
  const { consolide, parSociete } = useBeneficeParSociete();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comptabilité"
        description="Suivi interne des paiements — dossiers de transit et entreposage par société"
      >
        <Button
          variant="outline"
          onClick={screen.exportExcel}
          disabled={screen.filtered.length === 0}
          title="Exporter en Excel"
          aria-label="Exporter en Excel"
        >
          <FileSpreadsheet className="size-4" />
          <span className="hidden sm:inline">Excel</span>
        </Button>
        {screen.canWrite && (
          <Button onClick={screen.openNewEcriture}>
            <Plus className="size-4" />
            Nouvelle écriture
          </Button>
        )}
      </PageHeader>

      <Tabs value={screen.resolvedTab} onValueChange={screen.setActiveTab}>
        <TabsList className="h-10 flex-wrap">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          {screen.sortedSocietes.map((societe) => (
            <TabsTrigger key={societe.id} value={societe.id}>Société {societe.nom}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <PaymentInfoBanner onOpenFactures={() => screen.go("factures")} />
      <EcrituresKpiRow
        totalInvesti={screen.totalInvesti}
        totalPaye={screen.totalPaye}
        totalDu={screen.totalDu}
        enAttenteCount={screen.enAttenteCount}
      />
      <BeneficeKpiRow
        resolvedTab={screen.resolvedTab}
        societesCount={screen.sortedSocietes.length}
        consolide={consolide}
        parSociete={parSociete}
      />
      <PendingAlertBanner count={screen.enAttenteCount} totalDu={screen.totalDu} />
      <EcrituresFilters
        query={screen.query}
        statutFilter={screen.statutFilter}
        clientFilter={screen.clientFilter}
        clients={screen.clients}
        resultCount={screen.filtered.length}
        hasActiveFilters={screen.hasActiveFilters}
        onQueryChange={(value) => { screen.setQuery(value); screen.setPage(1); }}
        onStatutChange={(value) => { screen.setStatutFilter(value); screen.setPage(1); }}
        onClientChange={(value) => { screen.setClientFilter(value); screen.setPage(1); }}
        onClear={screen.clearFilters}
      />
      <EcrituresTable
        ecritures={screen.paged}
        totalItems={screen.filtered.length}
        hasActiveFilters={screen.hasActiveFilters}
        canWrite={screen.canWrite}
        startIdx={screen.startIdx}
        endIdx={screen.endIdx}
        page={screen.page}
        totalPages={screen.totalPages}
        onPageChange={screen.setPage}
        onPayment={screen.openPayment}
        onCreate={screen.openNewEcriture}
      />
      <PaymentDialog
        open={screen.paymentOpen}
        selected={screen.selected}
        montant={screen.montant}
        mode={screen.mode}
        datePaiement={screen.datePaiement}
        note={screen.note}
        onOpenChange={screen.setPaymentOpen}
        onMontantChange={screen.setMontant}
        onModeChange={screen.setMode}
        onDateChange={screen.setDatePaiement}
        onNoteChange={screen.setNote}
        onValidate={screen.validatePayment}
      />
      <NewEcritureDialog
        open={screen.newOpen}
        clients={screen.clients}
        societes={screen.societes}
        clientDossiers={screen.clientDossiers}
        clientId={screen.neClientId}
        dossierId={screen.neDossierId}
        investi={screen.neInvesti}
        paye={screen.nePaye}
        mode={screen.neMode}
        date={screen.neDate}
        note={screen.neNote}
        societeId={screen.neSocieteId}
        onOpenChange={screen.setNewOpen}
        onClientChange={screen.handleClientChange}
        onDossierChange={screen.handleDossierChange}
        onInvestiChange={screen.setNeInvesti}
        onPayeChange={screen.setNePaye}
        onModeChange={screen.setNeMode}
        onDateChange={screen.setNeDate}
        onNoteChange={screen.setNeNote}
        onSocieteChange={screen.setNeSocieteId}
        onCreate={screen.createEcriture}
      />
    </div>
  );
}

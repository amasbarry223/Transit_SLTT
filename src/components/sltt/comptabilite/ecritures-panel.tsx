"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BeneficeKpiRow } from "@/components/sltt/comptabilite/benefice-kpi-row";
import { EcrituresFilters } from "@/components/sltt/comptabilite/ecritures-filters";
import { EcrituresKpiRow } from "@/components/sltt/comptabilite/ecritures-kpi-row";
import { EcrituresTable } from "@/components/sltt/comptabilite/ecritures-table";
import { NewEcritureDialog } from "@/components/sltt/comptabilite/new-ecriture-dialog";
import { PaymentDialog } from "@/components/sltt/comptabilite/payment-dialog";
import { PaymentInfoBanner } from "@/components/sltt/comptabilite/payment-info-banner";
import { PendingAlertBanner } from "@/components/sltt/comptabilite/pending-alert-banner";
import type { useEcrituresScreen } from "@/components/sltt/comptabilite/use-ecritures-screen";
import type { useBeneficeParSociete } from "@/hooks/use-benefice-par-societe";

interface EcrituresPanelProps {
  screen: ReturnType<typeof useEcrituresScreen>;
  benefice: ReturnType<typeof useBeneficeParSociete>;
}

export function EcrituresPanel({ screen, benefice }: EcrituresPanelProps) {
  const { consolide, parSociete } = benefice;

  return (
    <TabsContent value="ecritures" className="mt-0 space-y-6">
      <Tabs value={screen.resolvedTab} onValueChange={screen.setActiveTab}>
        <TabsList className="h-10 flex-wrap">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          {screen.sortedSocietes.map((societe) => (
            <TabsTrigger key={societe.id} value={societe.id}>
              Société {societe.nom}
            </TabsTrigger>
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
        onQueryChange={(value) => {
          screen.setQuery(value);
          screen.setPage(1);
        }}
        onStatutChange={(value) => {
          screen.setStatutFilter(value);
          screen.setPage(1);
        }}
        onClientChange={(value) => {
          screen.setClientFilter(value);
          screen.setPage(1);
        }}
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
    </TabsContent>
  );
}

"use client";

import { useState } from "react";
import { ArrowLeft, Banknote, Building2, CalendarDays, FolderKanban, Package, User } from "lucide-react";
import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { usePermission } from "@/hooks/use-permission";
import type { DevisInput, DevisStatut } from "@/lib/store";
import { formatFCFA, formatDateShort, parseAmount } from "@/lib/format";
import { printDevis } from "@/lib/export";
import { resolveSlttBrand } from "@/lib/classeur";
import { useToast } from "@/hooks/use-toast";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConvertDevisDialog } from "@/components/sltt/convert-devis-dialog";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { ConfirmActionDialog } from "@/components/sltt/confirm-action-dialog";
import { devisStatutNeedsConfirm } from "@/lib/confirm-transitions";
import { InfoRow } from "@/components/sltt/devis/info-row";
import { FinancialBreakdown } from "@/components/sltt/devis/financial-breakdown";
import { DevisPipelineCard } from "@/components/sltt/devis/devis-pipeline-card";
import { DevisActionsCard } from "@/components/sltt/devis/devis-actions-card";
import { DevisEditForm } from "@/components/sltt/devis/devis-edit-form";
import { DevisSummaryHeader } from "@/components/sltt/devis/devis-summary-header";

export function DevisDetailScreen() {
  const go = useNav((s) => s.go);
  const openDossierDetail = useNav((s) => s.openDossierDetail);
  const selectedId = useNav((s) => s.selectedId);
  const devisEditMode = useNav((s) => s.devisEditMode);
  const allDevis = useStore((s) => s.devis);
  const clients = useStore((s) => s.clients);
  const societes = useStore((s) => s.societes);
  const updateDevis = useStore((s) => s.updateDevis);
  const updateDevisStatut = useStore((s) => s.updateDevisStatut);
  const removeDevis = useStore((s) => s.removeDevis);
  const { toast } = useToast();
  const canWrite = usePermission("devis:write");
  const devis = allDevis.find((d) => d.id === selectedId);
  const [isEditing, setIsEditing] = useState(devisEditMode);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmConvert, setConfirmConvert] = useState(false);
  const [pendingStatut, setPendingStatut] = useState<DevisStatut | null>(null);
  useUnsavedChangesWarning(isEditing);

  const [fSocieteId, setFSocieteId] = useState("");
  const [fClientId, setFClientId] = useState("");
  const [fClientNom, setFClientNom] = useState("");
  const [fNature, setFNature] = useState("");
  const [fDroitDouane, setFDroitDouane] = useState("");
  const [fFraisCircuit, setFFraisCircuit] = useState("");
  const [fFraisPrestation, setFFraisPrestation] = useState("");
  const [fDateValidite, setFDateValidite] = useState("");
  const [fNotes, setFNotes] = useState("");
  const editKey = isEditing ? (devis?.id ?? null) : null;
  const [prevEditKey, setPrevEditKey] = useState(editKey);
  if (editKey !== prevEditKey) {
    setPrevEditKey(editKey);
    if (editKey !== null && devis) {
      setFSocieteId(devis.societeId); setFClientId(devis.clientId); setFClientNom(devis.clientNom);
      setFNature(devis.nature); setFDroitDouane(String(devis.droitDouane));
      setFFraisCircuit(String(devis.fraisCircuit)); setFFraisPrestation(String(devis.fraisPrestation));
      setFDateValidite(devis.dateValidite); setFNotes(devis.notes ?? "");
    }
  }

  if (!devis) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <FolderKanban className="size-14 text-slate-200 dark:text-slate-700" />
        <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Devis introuvable</p>
        <Button variant="outline" className="mt-5" onClick={() => go("devis")}>
          <ArrowLeft className="mr-2 size-4" /> Retour aux devis
        </Button>
      </div>
    );
  }

  const dd = parseAmount(fDroitDouane), fc = parseAmount(fFraisCircuit), fp = parseAmount(fFraisPrestation);
  const editTotal = dd + fc + fp;
  const canEditContent = canWrite && !devis.dossierId && devis.statut !== "Accepté";
  const editValid = !!fSocieteId && !!fClientId && !!fNature.trim() && !!fDateValidite;
  const startEdit = () => { setIsEditing(true); setConfirmDelete(false); setConfirmConvert(false); };
  const requestConvert = () => { setConfirmConvert(true); setConfirmDelete(false); };
  const requestDelete = () => { setConfirmDelete(true); setConfirmConvert(false); };
  const handleClientChange = (id: string) => {
    setFClientId(id);
    const client = clients.find((item) => item.id === id);
    if (client) setFClientNom(client.nom);
  };
  const handleSave = () => {
    if (!canEditContent) {
      toast({ title: "Modification impossible", description: "Ce devis a été accepté ou converti en dossier entre-temps : il n'est plus modifiable.", variant: "destructive" });
      setIsEditing(false);
      return;
    }
    if (!editValid) return;
    updateDevis(devis.id, {
      societeId: fSocieteId, clientId: fClientId, clientNom: fClientNom, nature: fNature,
      droitDouane: dd, fraisCircuit: fc, fraisPrestation: fp, dateValidite: fDateValidite,
      notes: fNotes.trim() || undefined,
    } satisfies DevisInput);
    toast({ title: "Devis mis à jour", description: devis.reference });
    setIsEditing(false);
  };
  const handleCancelEdit = () => { setIsEditing(false); setConfirmDelete(false); setConfirmConvert(false); };
  const handleStatutChange = async (statut: DevisStatut) => {
    if (!canWrite || statut === devis.statut) return;
    if (devisStatutNeedsConfirm(statut)) {
      setPendingStatut(statut);
      return;
    }
    await applyStatut(statut);
  };
  async function applyStatut(statut: DevisStatut) {
    const d = devis;
    if (!d) return;
    try {
      await updateDevisStatut(d.id, statut);
      toast({ title: "Statut mis à jour", description: `${d.reference} → ${statut}` });
    } catch (error) {
      toast({ title: "Transition impossible", description: error instanceof Error ? error.message : "Cette transition de statut n'est pas autorisée.", variant: "destructive" });
    }
  };
  const handlePrint = () => {
    const client = clients.find((item) => item.id === devis.clientId);
    printDevis({
      reference: devis.reference, clientNom: devis.clientNom, clientAdresse: client?.adresse,
      clientTelephone: client?.telephone, clientEmail: client?.email, nature: devis.nature,
      dateCreation: devis.dateCreation, dateValidite: devis.dateValidite, droitDouane: devis.droitDouane,
      fraisCircuit: devis.fraisCircuit, fraisPrestation: devis.fraisPrestation, total: devis.total,
      notes: devis.notes, statut: devis.statut,
    }, resolveSlttBrand(societes));
  };
  const handleDelete = async () => {
    if (!canWrite) return;
    try {
      await removeDevis(devis.id);
      toast({ title: "Devis supprimé", description: devis.reference });
      go("devis");
    } catch (error) {
      toast({ title: "Erreur", description: getErrorMessage(error, "Impossible de supprimer le devis"), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <button onClick={() => go("devis")} className="group inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" /> Retour aux devis
      </button>
      <DevisSummaryHeader
        devis={devis} isEditing={isEditing} canWrite={canWrite} canEditContent={canEditContent}
        editValid={editValid} onStartEdit={startEdit} onPrint={handlePrint}
        onStatutChange={handleStatutChange} onOpenDossier={openDossierDetail}
        onConvert={requestConvert} onDelete={requestDelete} onCancelEdit={handleCancelEdit} onSave={handleSave}
      />
      {!isEditing && (
        <div className="grid gap-5 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-3">
            <Card className="border-border/80 shadow-sm">
              <div className="border-b border-border/60 bg-slate-50/60 px-5 py-3 dark:bg-slate-800/60">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Informations</h2>
              </div>
              <div className="px-5">
                <InfoRow icon={Building2} label="Société" value={devis.societeNom} />
                <InfoRow icon={User} label="Client" value={devis.clientNom} />
                <InfoRow icon={Package} label="Nature de la marchandise" value={devis.nature} />
                <InfoRow icon={CalendarDays} label="Date de création" value={formatDateShort(devis.dateCreation)} />
                <InfoRow icon={CalendarDays} label="Valide jusqu'au" value={formatDateShort(devis.dateValidite)} />
                <InfoRow icon={Banknote} label="Montant total estimé" value={formatFCFA(devis.total)} />
              </div>
            </Card>
            {devis.notes && (
              <Card className="border-border/80 shadow-sm">
                <div className="border-b border-border/60 bg-slate-50/60 px-5 py-3 dark:bg-slate-800/60">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Notes & conditions</h2>
                </div>
                <p className="whitespace-pre-wrap px-5 py-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{devis.notes}</p>
              </Card>
            )}
          </div>
          <div className="space-y-5 lg:col-span-2">
            <DevisPipelineCard statut={devis.statut} canWrite={canWrite} onSelect={handleStatutChange} />
            <Card className="overflow-hidden border-border/80 shadow-sm">
              <div className="border-b border-border/60 bg-slate-50/60 px-5 py-3 dark:bg-slate-800/60">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Estimation financière</h2>
              </div>
              <FinancialBreakdown devis={devis} />
            </Card>
            <DevisActionsCard
              devis={devis} canWrite={canWrite} canEditContent={canEditContent} onPrint={handlePrint}
              onEdit={startEdit} onOpenDossier={openDossierDetail} onConvert={requestConvert} onDelete={requestDelete}
            />
          </div>
        </div>
      )}
      {isEditing && (
        <DevisEditForm
          devis={devis} societes={societes} clients={clients} fSocieteId={fSocieteId}
          setFSocieteId={setFSocieteId} fClientId={fClientId} handleClientChange={handleClientChange}
          fNature={fNature} setFNature={setFNature} fDroitDouane={fDroitDouane}
          setFDroitDouane={setFDroitDouane} fFraisCircuit={fFraisCircuit}
          setFFraisCircuit={setFFraisCircuit} fFraisPrestation={fFraisPrestation}
          setFFraisPrestation={setFFraisPrestation} fDateValidite={fDateValidite}
          setFDateValidite={setFDateValidite} fNotes={fNotes} setFNotes={setFNotes}
          editTotal={editTotal} handleCancelEdit={handleCancelEdit} handleSave={handleSave}
        />
      )}
      <ConvertDevisDialog
        key={confirmConvert && !isEditing ? devis.id : "closed"}
        devis={confirmConvert && !isEditing ? devis : null}
        onClose={() => setConfirmConvert(false)} onConverted={openDossierDetail}
      />
      <ConfirmDeleteDialog
        open={confirmDelete && !isEditing}
        onOpenChange={(open) => setConfirmDelete(open)}
        title="Supprimer ce devis ?"
        description={
          <>
            Le devis <strong>{devis.reference}</strong> ({devis.clientNom} · {formatFCFA(devis.total)}) sera supprimé
            de façon permanente et irréversible.
            {devis.dossierId && (
              <> Le dossier associé n&apos;est pas supprimé, mais son devis d&apos;origine disparaîtra de l&apos;historique.</>
            )}
          </>
        }
        consequences={
          devis.dossierId ? ["Ce devis est à l'origine d'un dossier — le dossier reste intact."] : undefined
        }
        onConfirm={async () => {
          await handleDelete();
          setConfirmDelete(false);
        }}
      />
      <ConfirmActionDialog
        open={!!pendingStatut}
        onOpenChange={(open) => !open && setPendingStatut(null)}
        title={`Passer le devis au statut « ${pendingStatut} » ?`}
        description={
          <>
            Le devis <strong>{devis.reference}</strong> passera au statut <strong>{pendingStatut}</strong>. Cette
            transition peut limiter les modifications ultérieures.
          </>
        }
        confirmLabel={`Passer à ${pendingStatut ?? ""}`}
        variant={pendingStatut === "Refusé" ? "destructive" : "default"}
        onConfirm={async () => {
          if (!pendingStatut) return;
          await applyStatut(pendingStatut);
          setPendingStatut(null);
        }}
      />
    </div>
  );
}

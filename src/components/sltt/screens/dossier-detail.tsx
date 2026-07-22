"use client";

import { useState, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { ArrowLeft, Info, Check, Plus } from "lucide-react";
import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import type { SubDossier, DossierFournisseurInput, FournisseurType } from "@/lib/store";
import { calculerEcart, resteAPayer } from "@/lib/domain-types";
import { formatFCFA, formatDateShort, parseLocalDate } from "@/lib/format";
import { CHART_COLORS } from "@/lib/constants";
import {
  calculateDaysUntil,
  isEcheanceDepassee,
  isEcheanceImminente,
} from "@/lib/echeance-utils";
import { printHTML, htmlEscape } from "@/lib/export";
import { resolvePrintHTMLBrand } from "@/lib/societe-brand";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  TransitionDialog,
  getNextTransition,
} from "@/components/sltt/dossier-transition-dialog";
import { DossierDetailHero } from "@/components/sltt/dossier-detail/dossier-detail-hero";
import { DossierDetailOverview } from "@/components/sltt/dossier-detail/dossier-detail-overview";
import { DossierDetailDocuments } from "@/components/sltt/dossier-detail/dossier-detail-documents";
import { DossierDetailSuivi } from "@/components/sltt/dossier-detail/dossier-detail-suivi";

export function DossierDetailScreen() {
  const { selectedId, go, openDossier } = useNav();
  const { toast } = useToast();

  const dossier = useStore((state) => state.dossiers.find((item) => item.id === selectedId));
  const societes = useStore((state) => state.societes);
  const addSubDossier = useStore((state) => state.addSubDossier);
  const updateSubDossier = useStore((state) => state.updateSubDossier);
  const deleteSubDossier = useStore((state) => state.deleteSubDossier);
  const addFichier = useStore((state) => state.addFichier);
  const deleteFichier = useStore((state) => state.deleteFichier);
  const fournisseurs = useStore(useShallow((state) => state.fournisseurs));
  const addDossierFournisseur = useStore((state) => state.addDossierFournisseur);
  const removeDossier = useStore((state) => state.removeDossier);
  const canWrite = usePermission("dossiers:write");
  const canTransition = usePermission("dossiers:transition");

  const dossierId = selectedId ?? "";
  const dossierFournisseurs = useStore(
    useShallow((state) => state.dossierFournisseurs.filter((item) => item.dossierId === dossierId)),
  );
  const allSubDossiers = useStore(
    useShallow((state) => state.subDossiers.filter((item) => item.dossierId === dossierId)),
  );
  const allFichiers = useStore(
    useShallow((state) => state.fichiers.filter((item) => item.dossierId === dossierId)),
  );
  const allEcritures = useStore(
    useShallow((state) => state.ecritures.filter((item) => item.dossierId === dossierId)),
  );
  const auditLogs = useStore(useShallow((state) => state.auditLogs));
  const dossierFactures = useStore(
    useShallow((state) => state.factures.filter((item) => item.dossierId === dossierId)),
  );

  const [transitionOpen, setTransitionOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [subDossierDialogOpen, setSubDossierDialogOpen] = useState(false);
  const [subDossierEditId, setSubDossierEditId] = useState<string | null>(null);
  const [subDossierName, setSubDossierName] = useState("");
  const [subDossierDescription, setSubDossierDescription] = useState("");
  const [subDossierDeleteId, setSubDossierDeleteId] = useState<string | null>(null);
  const [fournisseurDialogOpen, setFournisseurDialogOpen] = useState(false);
  const [selectedFournisseurId, setSelectedFournisseurId] = useState("");
  const [fournisseurDescription, setFournisseurDescription] = useState("");
  const [fournisseurBudgetAmount, setFournisseurBudgetAmount] = useState("");
  const [fournisseurActualAmount, setFournisseurActualAmount] = useState("");
  const [fournisseurStatut, setFournisseurStatut] = useState<"En attente" | "Payé" | "Litige">(
    "En attente",
  );
  const [fournisseurDate, setFournisseurDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  const subDossiers = allSubDossiers;

  const dossierFichiers = useMemo(
    () => allFichiers.filter((fichier) => !fichier.sousDossierId),
    [allFichiers],
  );

  const fichiersBySubDossier = useMemo(() => {
    const map = new Map<string, typeof allFichiers>();
    allFichiers.forEach((fichier) => {
      if (fichier.sousDossierId) {
        if (!map.has(fichier.sousDossierId)) map.set(fichier.sousDossierId, []);
        map.get(fichier.sousDossierId)!.push(fichier);
      }
    });
    return map;
  }, [allFichiers]);

  const totalFichiers = allFichiers.length;
  const dossierEcritures = allEcritures;

  const dossierAuditLogs = useMemo(() => {
    if (!dossier) return [];
    const escapedReference = dossier.reference.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const referenceRegex = new RegExp(`\\b${escapedReference}\\b`);
    return auditLogs.filter((entry) => referenceRegex.test(entry.detail));
  }, [auditLogs, dossier?.reference]);

  const suiviCount =
    dossierEcritures.length +
    dossierFactures.length +
    dossierFournisseurs.length +
    dossierAuditLogs.length;

  if (!dossier) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
          <Info className="size-7" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Dossier introuvable
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Ce dossier n&apos;existe pas ou a été supprimé.
          </p>
        </div>
        <Button variant="outline" onClick={() => go("dossiers")}>
          <ArrowLeft className="size-4" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  const currentDossier = dossier;

  const nextTransition = getNextTransition(currentDossier.statut);
  const ecart = calculerEcart(currentDossier);
  const reste = resteAPayer(currentDossier);
  const tauxRecouvrement =
    currentDossier.montantInvesti > 0
      ? Math.round((currentDossier.montantPaye / currentDossier.montantInvesti) * 100)
      : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const echeanceDate = currentDossier.dateEcheance
    ? parseLocalDate(currentDossier.dateEcheance)
    : null;
  echeanceDate?.setHours(0, 0, 0, 0);
  const joursRestants = echeanceDate ? calculateDaysUntil(echeanceDate, today) : null;
  const echeanceDepassee = isEcheanceDepassee(joursRestants);
  const echeanceImminente = isEcheanceImminente(joursRestants);

  function openCreateSubDossier() {
    setSubDossierEditId(null);
    setSubDossierName("");
    setSubDossierDescription("");
    setSubDossierDialogOpen(true);
  }

  function openEditSubDossier(subDossier: SubDossier) {
    setSubDossierEditId(subDossier.id);
    setSubDossierName(subDossier.nom);
    setSubDossierDescription(subDossier.description ?? "");
    setSubDossierDialogOpen(true);
  }

  function handleSaveSubDossier() {
    if (!canWrite) return;
    const trimmedName = subDossierName.trim();
    if (!trimmedName) return;
    if (subDossierEditId) {
      updateSubDossier(subDossierEditId, trimmedName, subDossierDescription.trim() || undefined);
      toast({ title: "Sous-dossier modifié", description: trimmedName });
    } else {
      addSubDossier({
        dossierId,
        nom: trimmedName,
        description: subDossierDescription.trim() || undefined,
      });
      toast({ title: "Sous-dossier créé", description: trimmedName });
    }
    setSubDossierDialogOpen(false);
  }

  function handleDeleteSubDossier() {
    if (!canWrite || !subDossierDeleteId) return;
    const subDossier = subDossiers.find((item) => item.id === subDossierDeleteId);
    deleteSubDossier(subDossierDeleteId);
    setSubDossierDeleteId(null);
    toast({ title: "Sous-dossier supprimé", description: subDossier?.nom });
  }

  function openAddFournisseur() {
    setSelectedFournisseurId("");
    setFournisseurDescription("");
    setFournisseurBudgetAmount("");
    setFournisseurActualAmount("");
    setFournisseurStatut("En attente");
    setFournisseurDate(new Date().toISOString().slice(0, 10));
    setFournisseurDialogOpen(true);
  }

  function handleSaveDossierFournisseur() {
    if (!canWrite || !selectedFournisseurId) return;
    const fournisseur = fournisseurs.find((item) => item.id === selectedFournisseurId);
    if (!fournisseur) return;
    const input: DossierFournisseurInput = {
      dossierId: currentDossier.id,
      dossierRef: currentDossier.reference,
      fournisseurId: fournisseur.id,
      fournisseurNom: fournisseur.nom,
      type: fournisseur.type as FournisseurType,
      description: fournisseurDescription.trim(),
      montantBudgete: fournisseurBudgetAmount ? parseFloat(fournisseurBudgetAmount) : 0,
      montantReel: fournisseurActualAmount ? parseFloat(fournisseurActualAmount) : 0,
      statut: fournisseurStatut,
      date: fournisseurDate,
    };
    addDossierFournisseur(input);
    setFournisseurDialogOpen(false);
    toast({ title: "Prestataire lié au dossier", description: fournisseur.nom });
  }

  function handleInvoice() {
    go("factures", { id: currentDossier.id });
  }

  function handlePdfExport() {
    const positiveMarginColor = CHART_COLORS.emerald;
    const negativeMarginColor = CHART_COLORS.red;
    printHTML(
      `Dossier ${currentDossier.reference}`,
      `
      <h1>Dossier de transit</h1>
      <div class="subtitle">Référence : <strong>${htmlEscape(currentDossier.reference)}</strong> · Statut : ${htmlEscape(currentDossier.statut)}</div>
      <table>
        <tbody>
          <tr><th style="width:35%">Client</th><td>${htmlEscape(currentDossier.clientNom)}</td></tr>
          <tr><th>Nature de la marchandise</th><td>${htmlEscape(currentDossier.nature) || "—"}</td></tr>
          <tr><th>N° de BL</th><td>${htmlEscape(currentDossier.bl) || "—"}</td></tr>
          <tr><th>N° du camion</th><td>${htmlEscape(currentDossier.camion) || "—"}</td></tr>
          <tr><th>Date</th><td>${currentDossier.date ? formatDateShort(currentDossier.date) : "—"}</td></tr>
        </tbody>
      </table>
      <h2 style="margin-top:24px;font-size:14px;color:#1e40af">Montants (FCFA)</h2>
      <table>
        <tbody>
          <tr><th style="width:35%">Droit de douane</th><td class="num">${formatFCFA(currentDossier.droitDouane, false)}</td></tr>
          <tr><th>Frais de circuit global</th><td class="num">${formatFCFA(currentDossier.fraisCircuit, false)}</td></tr>
          <tr><th>Frais de prestation</th><td class="num">${formatFCFA(currentDossier.fraisPrestation, false)}</td></tr>
          <tr><th>Montant investi</th><td class="num">${formatFCFA(currentDossier.montantInvesti, false)}</td></tr>
          <tr><th>Montant payé</th><td class="num">${formatFCFA(currentDossier.montantPaye, false)}</td></tr>
          <tr><th>Reste à payer</th><td class="num">${formatFCFA(reste, false)}</td></tr>
          <tr class="total-row">
            <th>Marge calculée</th>
            <td class="num" style="color:${ecart >= 0 ? positiveMarginColor : negativeMarginColor}">
              ${ecart >= 0 ? "+" : ""}${ecart.toLocaleString("fr-FR")}
            </td>
          </tr>
        </tbody>
      </table>
      ${currentDossier.notes ? `<h2 style="margin-top:24px;font-size:14px;color:#1e40af">Notes</h2><p style="font-size:13px;color:#475569;white-space:pre-wrap">${htmlEscape(currentDossier.notes)}</p>` : ""}
      ${subDossiers.length > 0 ? `<h2 style="margin-top:24px;font-size:14px;color:#1e40af">Sous-dossiers (${subDossiers.length})</h2><ul style="font-size:13px;color:#475569">${subDossiers.map((subDossier) => `<li>${htmlEscape(subDossier.nom)}${subDossier.description ? ` — ${htmlEscape(subDossier.description)}` : ""}</li>`).join("")}</ul>` : ""}
    `,
      resolvePrintHTMLBrand(societes),
    );
    toast({
      title: "PDF généré",
      description: "Le document s'est ouvert dans une nouvelle fenêtre.",
    });
  }

  const deleteConsequences = [
    allFichiers.length > 0 && `${allFichiers.length} fichier(s) archivé(s) définitivement supprimé(s)`,
    subDossiers.length > 0 && `${subDossiers.length} sous-dossier(s) définitivement supprimé(s)`,
    dossierFournisseurs.length > 0 &&
      `${dossierFournisseurs.length} prestataire(s) lié(s) définitivement supprimé(s)`,
    allEcritures.length > 0 &&
      `${allEcritures.length} écriture(s) comptable(s) seront déconnectée(s) du dossier (non supprimées)`,
    dossierFactures.length > 0 &&
      `${dossierFactures.length} facture(s) seront déconnectée(s) du dossier (non supprimées)`,
  ].filter(Boolean) as string[];

  async function handleDelete() {
    try {
      await removeDossier(currentDossier.id);
      toast({ title: "Dossier supprimé", description: currentDossier.reference });
      go("dossiers");
    } catch (error) {
      toast({
        title: "Suppression impossible",
        description: error instanceof Error ? error.message : "Erreur inattendue.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <DossierDetailHero
        dossier={currentDossier}
        reste={reste}
        ecart={ecart}
        tauxRecouvrement={tauxRecouvrement}
        joursRestants={joursRestants}
        echeanceDepassee={echeanceDepassee}
        echeanceImminente={echeanceImminente}
        nextTransition={nextTransition}
        canWrite={canWrite}
        canTransition={canTransition}
        onBack={() => go("dossiers")}
        onEdit={() => openDossier(currentDossier.id, "edit")}
        onTransition={() => setTransitionOpen(true)}
        onInvoice={handleInvoice}
        onPdf={handlePdfExport}
        onDelete={() => setDeleteOpen(true)}
      />

      <Tabs defaultValue="apercu">
        <TabsList className="mb-4 h-10 flex-wrap">
          <TabsTrigger value="apercu">Aperçu</TabsTrigger>
          <TabsTrigger value="documents">
            Documents
            {totalFichiers > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {totalFichiers}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="suivi">
            Suivi
            {suiviCount > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {suiviCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apercu">
          <DossierDetailOverview
            dossier={currentDossier}
            ecart={ecart}
            reste={reste}
            nextTransition={nextTransition}
            canTransition={canTransition}
            echeanceDepassee={echeanceDepassee}
            echeanceImminente={echeanceImminente}
            joursRestants={joursRestants}
            onTransition={() => setTransitionOpen(true)}
          />
        </TabsContent>

        <TabsContent value="documents">
          <DossierDetailDocuments
            dossierId={currentDossier.id}
            dossierFichiers={dossierFichiers}
            subDossiers={subDossiers}
            fichiersBySubDossier={fichiersBySubDossier}
            onCreateSubDossier={openCreateSubDossier}
            onEditSubDossier={openEditSubDossier}
            onDeleteSubDossier={setSubDossierDeleteId}
                addFichier={addFichier}
                deleteFichier={deleteFichier}
              />
        </TabsContent>

        <TabsContent value="suivi">
          <DossierDetailSuivi
            dossier={currentDossier}
            ecritures={dossierEcritures}
            factures={dossierFactures}
            fournisseurs={dossierFournisseurs}
            auditLogs={dossierAuditLogs}
            onNewFacture={handleInvoice}
            onOpenFacture={(factureId) => go("facture-detail", { id: factureId })}
            onAddFournisseur={openAddFournisseur}
            onGoComptabilite={() => go("comptabilite")}
          />
        </TabsContent>
      </Tabs>

      {nextTransition && (
        <TransitionDialog
          dossier={currentDossier}
          transition={nextTransition}
          open={transitionOpen}
          onOpenChange={setTransitionOpen}
        />
      )}

      <Dialog open={subDossierDialogOpen} onOpenChange={setSubDossierDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {subDossierEditId ? "Modifier le sous-dossier" : "Nouveau sous-dossier"}
            </DialogTitle>
            <DialogDescription>
              {subDossierEditId
                ? "Mettez à jour le nom ou la description."
                : "Créez un sous-dossier pour organiser vos documents."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sd-nom" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sd-nom"
                value={subDossierName}
                onChange={(event) => setSubDossierName(event.target.value)}
                placeholder="ex. Documents douane"
                className="h-10"
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSaveSubDossier();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sd-desc" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Description (optionnel)
              </Label>
              <Input
                id="sd-desc"
                value={subDossierDescription}
                onChange={(event) => setSubDossierDescription(event.target.value)}
                placeholder="Brève description du contenu…"
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubDossierDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveSubDossier} disabled={!subDossierName.trim()}>
              {subDossierEditId ? (
                <>
                  <Check className="size-4" />
                  Enregistrer
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Créer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!subDossierDeleteId}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSubDossierDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce sous-dossier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le sous-dossier{" "}
              <strong>
                {subDossiers.find((item) => item.id === subDossierDeleteId)?.nom}
              </strong>{" "}
              et tous ses fichiers seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteSubDossier}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={fournisseurDialogOpen} onOpenChange={setFournisseurDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un prestataire</DialogTitle>
            <DialogDescription>
              Rattachez un fournisseur ou transporteur et son coût à ce dossier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Fournisseur <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedFournisseurId} onValueChange={setSelectedFournisseurId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Sélectionner un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {fournisseurs.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-slate-400 dark:text-slate-500">
                      Aucun fournisseur — créez-en un dans le module Fournisseurs.
                    </div>
                  ) : (
                    fournisseurs.map((fournisseur) => (
                      <SelectItem key={fournisseur.id} value={fournisseur.id}>
                        {fournisseur.nom} · {fournisseur.type}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Description
              </Label>
              <Input
                value={fournisseurDescription}
                onChange={(event) => setFournisseurDescription(event.target.value)}
                placeholder="ex. Transport Dakar → Bamako"
                className="h-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Montant budgété (FCFA)
                </Label>
                <Input
                  type="number"
                  value={fournisseurBudgetAmount}
                  onChange={(event) => setFournisseurBudgetAmount(event.target.value)}
                  placeholder="0"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Montant réel (FCFA)
                </Label>
                <Input
                  type="number"
                  value={fournisseurActualAmount}
                  onChange={(event) => setFournisseurActualAmount(event.target.value)}
                  placeholder="0"
                  className="h-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date</Label>
                <Input
                  type="date"
                  value={fournisseurDate}
                  onChange={(event) => setFournisseurDate(event.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Statut</Label>
                <Select
                  value={fournisseurStatut}
                  onValueChange={(value) =>
                    setFournisseurStatut(value as typeof fournisseurStatut)
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="En attente">En attente</SelectItem>
                    <SelectItem value="Payé">Payé</SelectItem>
                    <SelectItem value="Litige">Litige</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFournisseurDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveDossierFournisseur} disabled={!selectedFournisseurId}>
              <Check className="size-4" />
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer ce dossier ?"
        description={
          <>
            Le dossier <strong>{currentDossier.reference}</strong> sera définitivement supprimé.
            Cette action est irréversible.
          </>
        }
        consequences={deleteConsequences}
        onConfirm={handleDelete}
      />
    </div>
  );
}

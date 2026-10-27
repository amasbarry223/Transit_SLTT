"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Info, Check, Plus } from "lucide-react";
import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import type { SubDossier, DossierFournisseurInput, FournisseurType } from "@/lib/store";
import { financesDossier } from "@/lib/domain-types";
import { dossierMontantsHtml } from "@/lib/export/print-modules/dossier-montants";
import { formatDateShort } from "@/lib/format";
import { BRAND } from "@/lib/brand-colors";
import { printHTML, htmlEscape } from "@/lib/export";
import { resolveSlttBrand } from "@/lib/societe-brand";
import { useToast } from "@/shared/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/shared/utils/toast-helpers";
import { UI } from "@/shared/utils/ui-messages";
import { usePermission } from "@/shared/hooks/use-permission";
import { cn } from "@/shared/utils/cn";
import { ConfirmDeleteDialog } from "@/components/sltt/confirm-delete-dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import {
  TransitionDialog,
  getNextTransition,
} from "@/components/sltt/dossier-transition-dialog";
import { DossierDetailDocuments } from "@/components/sltt/dossier-detail/dossier-detail-documents";
import { DossierDetailSuivi } from "@/components/sltt/dossier-detail/dossier-detail-suivi";
import { OcrReviewDialogLazy } from "@/components/sltt/documents/ocr-review-dialog-lazy";
import { DossierScreenRedesign } from "./dossier-screen-redesign";

export function DossierDetailScreen() {
  const { selectedId, go } = useNav();
  const { toast } = useToast();

  const dossier = useStore((state) => state.dossiers.find((item) => item.id === selectedId));
  const societes = useStore((state) => state.societes);
  const addSubDossier = useStore((state) => state.addSubDossier);
  const updateSubDossier = useStore((state) => state.updateSubDossier);
  const deleteSubDossier = useStore((state) => state.deleteSubDossier);
  const addFichier = useStore((state) => state.addFichier);
  const deleteFichier = useStore((state) => state.deleteFichier);
  const fournisseurs = useStore((state) => state.fournisseurs);
  const addDossierFournisseur = useStore((state) => state.addDossierFournisseur);
  const removeDossier = useStore((state) => state.removeDossier);
  const canWrite = usePermission("dossiers:write");

  const dossierId = selectedId ?? "";
  const dossierFournisseursSource = useStore((state) => state.dossierFournisseurs);
  const subDossiersSource = useStore((state) => state.subDossiers);
  const fichiersSource = useStore((state) => state.fichiers);
  const ecrituresSource = useStore((state) => state.ecritures);
  const auditLogs = useStore((state) => state.auditLogs);
  const facturesSource = useStore((state) => state.factures);
  const bonsSource = useStore((state) => state.bons);

  // Dérivés à partir des tableaux du store : ne se recalculent que si la
  // source pertinente ou le dossier affiché change, pas à chaque écriture
  // du store (contrairement à un filter() fait dans le sélecteur Zustand).
  const dossierFournisseurs = useMemo(
    () => dossierFournisseursSource.filter((item) => item.dossierId === dossierId),
    [dossierFournisseursSource, dossierId],
  );
  const allSubDossiers = useMemo(
    () => subDossiersSource.filter((item) => item.dossierId === dossierId),
    [subDossiersSource, dossierId],
  );
  const allFichiers = useMemo(
    () => fichiersSource.filter((item) => item.dossierId === dossierId),
    [fichiersSource, dossierId],
  );
  const allEcritures = useMemo(
    () => ecrituresSource.filter((item) => item.dossierId === dossierId),
    [ecrituresSource, dossierId],
  );
  const dossierFactures = useMemo(
    () => facturesSource.filter((item) => item.dossierId === dossierId),
    [facturesSource, dossierId],
  );

  const [activeTab, setActiveTab] = useState<"apercu" | "documents" | "suivi">("apercu");
  const [transitionOpen, setTransitionOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [ocrDocumentId, setOcrDocumentId] = useState<string | null>(null);
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
  const [savingSubDossier, setSavingSubDossier] = useState(false);
  const [deletingSubDossier, setDeletingSubDossier] = useState(false);
  const [savingFournisseur, setSavingFournisseur] = useState(false);

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
          <h2 className="text-lg font-semibold text-foreground">
            Dossier introuvable
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
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
  const finances = financesDossier(currentDossier);
  const nextTransition = getNextTransition(currentDossier.statut);

  function openCreateSubDossier() {
    setSubDossierEditId(null);
    setSubDossierName("");
    setSubDossierDescription("");
    setSubDossierDialogOpen(true);
    // handleSaveSubDossier ne réarme plus `savingSubDossier` après un succès
    // (le dialog reste monté et cliquable pendant son animation de fermeture) :
    // on le réarme ici à chaque ouverture.
    setSavingSubDossier(false);
  }

  function handleStartOcr(documentId: string) {
    setOcrDocumentId(documentId);
  }

  function openEditSubDossier(subDossier: SubDossier) {
    setSubDossierEditId(subDossier.id);
    setSubDossierName(subDossier.nom);
    setSubDossierDescription(subDossier.description ?? "");
    setSubDossierDialogOpen(true);
    setSavingSubDossier(false);
  }

  async function handleSaveSubDossier() {
    // Sans await/catch/garde saving, un réseau lent ou un refus RLS
    // laissait un toast de succès s'afficher quand même (fire-and-forget)
    // et un double-clic pouvait créer deux sous-dossiers dupliqués.
    if (!canWrite || savingSubDossier) return;
    const trimmedName = subDossierName.trim();
    if (!trimmedName) return;
    setSavingSubDossier(true);
    try {
      if (subDossierEditId) {
        await updateSubDossier(subDossierEditId, trimmedName, subDossierDescription.trim() || undefined);
        toastSuccess(toast, { title: "Sous-dossier modifié", description: trimmedName });
      } else {
        await addSubDossier({
          dossierId,
          nom: trimmedName,
          description: subDossierDescription.trim() || undefined,
        });
        toastSuccess(toast, { title: "Sous-dossier créé", description: trimmedName });
      }
      setSubDossierDialogOpen(false);
    } catch (error) {
      toastError(toast, error, { title: "Impossible d'enregistrer le sous-dossier", fallback: "Impossible d'enregistrer le sous-dossier." });
      setSavingSubDossier(false);
    }
  }

  async function handleDeleteSubDossier() {
    if (!canWrite || !subDossierDeleteId || deletingSubDossier) return;
    const subDossier = subDossiers.find((item) => item.id === subDossierDeleteId);
    setDeletingSubDossier(true);
    try {
      await deleteSubDossier(subDossierDeleteId);
      setSubDossierDeleteId(null);
      toastSuccess(toast, { title: "Sous-dossier supprimé", description: subDossier?.nom });
    } catch (error) {
      toastError(toast, error, { title: "Impossible de supprimer le sous-dossier", fallback: "Impossible de supprimer le sous-dossier." });
    } finally {
      setDeletingSubDossier(false);
    }
  }

  function openAddFournisseur() {
    setSelectedFournisseurId("");
    setFournisseurDescription("");
    setFournisseurBudgetAmount("");
    setFournisseurActualAmount("");
    setFournisseurStatut("En attente");
    setFournisseurDate(new Date().toISOString().slice(0, 10));
    setFournisseurDialogOpen(true);
    // handleSaveDossierFournisseur ne réarme plus `savingFournisseur` après un
    // succès (même fenêtre de double-soumission pendant l'animation de
    // fermeture du dialog) : on le réarme ici à chaque ouverture.
    setSavingFournisseur(false);
  }

  async function handleSaveDossierFournisseur() {
    if (!canWrite || !selectedFournisseurId || savingFournisseur) return;
    const fournisseur = fournisseurs.find((item) => item.id === selectedFournisseurId);
    if (!fournisseur) return;
    const input: DossierFournisseurInput = {
      dossierId: currentDossier.id,
      dossierRef: currentDossier.reference,
      fournisseurId: fournisseur.id,
      fournisseurNom: fournisseur.nom,
      type: fournisseur.type as FournisseurType,
      description: fournisseurDescription.trim(),
      // Jamais négatif : une saisie erronée fausserait l'écart et les totaux
      // agrégés sur l'écran Fournisseurs.
      montantBudgete: fournisseurBudgetAmount ? Math.max(0, parseFloat(fournisseurBudgetAmount) || 0) : 0,
      montantReel: fournisseurActualAmount ? Math.max(0, parseFloat(fournisseurActualAmount) || 0) : 0,
      statut: fournisseurStatut,
      date: fournisseurDate,
    };
    setSavingFournisseur(true);
    try {
      await addDossierFournisseur(input);
      setFournisseurDialogOpen(false);
      toastSuccess(toast, { title: "Fournisseur lié au dossier", description: fournisseur.nom });
    } catch (error) {
      toastError(toast, error, { title: "Impossible de lier le fournisseur", fallback: "Impossible de lier le fournisseur." });
      setSavingFournisseur(false);
    }
  }

  function handleInvoice() {
    go("factures", { id: currentDossier.id });
  }

  function handlePdfExport() {
    // Sans ce garde-fou explicite, un clic pendant que sociétés/annexes
    // finissent encore de charger (juste après l'arrivée sur l'écran)
    // ouvrait quand même l'alerte interne de printHTML (marque manquante)
    // MAIS déclenchait ensuite un toast "PDF généré" inconditionnel juste
    // après — message contradictoire qui laisse croire que ça a marché.
    const brand = resolveSlttBrand(societes);
    if (!brand) {
      toastWarning(toast, {
        title: "Chargement en cours",
        description: "Les informations de la société ne sont pas encore prêtes — réessayez dans un instant.",
      });
      return;
    }
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
      ${dossierMontantsHtml({
        finances,
        depenses: currentDossier.depenses,
        paiements: currentDossier.paiements,
      })}
      ${currentDossier.notes ? `<h2 style="margin-top:24px;font-size:14px;color:${BRAND.navy}">Notes</h2><p style="font-size:13px;color:#45556b;white-space:pre-wrap">${htmlEscape(currentDossier.notes)}</p>` : ""}
      ${subDossiers.length > 0 ? `<h2 style="margin-top:24px;font-size:14px;color:${BRAND.navy}">Sous-dossiers (${subDossiers.length})</h2><ul style="font-size:13px;color:#45556b">${subDossiers.map((subDossier) => `<li>${htmlEscape(subDossier.nom)}${subDossier.description ? ` — ${htmlEscape(subDossier.description)}` : ""}</li>`).join("")}</ul>` : ""}
    `,
      brand,
    );
    toastSuccess(toast, { title: "PDF généré", description: "Le document s'est ouvert dans une nouvelle fenêtre.", });
  }

  // Même heuristique que removeDossier() côté store (dossiers-slice.ts) : un
  // bon de sortie référence le dossier via son texte de marchandise, pas une
  // clé étrangère — signaler ce lien avant suppression plutôt que seulement
  // après coup dans le journal d'audit.
  const orphanBons = bonsSource.filter((bon) => bon.marchandise.includes(currentDossier.reference));

  const deleteConsequences = [
    allFichiers.length > 0 && `${allFichiers.length} fichier(s) archivé(s) définitivement supprimé(s)`,
    subDossiers.length > 0 && `${subDossiers.length} sous-dossier(s) définitivement supprimé(s)`,
    dossierFournisseurs.length > 0 &&
      `${dossierFournisseurs.length} fournisseur(s) lié(s) définitivement supprimé(s)`,
    allEcritures.length > 0 &&
      `${allEcritures.length} écriture(s) comptable(s) seront déconnectée(s) du dossier (non supprimées)`,
    dossierFactures.length > 0 &&
      `${dossierFactures.length} facture(s) seront déconnectée(s) du dossier (non supprimées)`,
    orphanBons.length > 0 &&
      `${orphanBons.length} bon(s) de sortie potentiellement lié(s) resteront orphelin(s) (non supprimés)`,
  ].filter(Boolean) as string[];

  async function handleDelete() {
    if (!canWrite) return;
    try {
      await removeDossier(currentDossier.id);
      toastSuccess(toast, { title: "Dossier supprimé", description: currentDossier.reference });
      go("dossiers");
    } catch (error) {
      toastError(toast, error, {
        title: "Impossible de supprimer le dossier",
        fallback: UI.errors.generic,
      });
    }
  }

  return (
    <div className="w-full space-y-6">
      {activeTab === "apercu" && (
        <DossierScreenRedesign
          existingDossier={currentDossier}
          isEdit={true}
          onPdfExport={handlePdfExport}
          onTransition={nextTransition ? () => setTransitionOpen(true) : undefined}
          nextTransitionLabel={nextTransition ? `Passer à : ${nextTransition}` : null}
          onDelete={() => setDeleteOpen(true)}
          extraTabsHeader={
            totalFichiers > 0 || suiviCount > 0 ? (
              <div className="flex items-center gap-1.5 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("apercu")}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all",
                    activeTab === "apercu"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                  )}
                >
                  Détail du dossier
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("documents")}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5",
                    (activeTab as string) === "documents"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                  )}
                >
                  <span>Documents</span>
                  {totalFichiers > 0 && (
                    <span className="rounded-full bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                      {totalFichiers}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("suivi")}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5",
                    (activeTab as string) === "suivi"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                  )}
                >
                  <span>Suivi & Écritures</span>
                  {suiviCount > 0 && (
                    <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      {suiviCount}
                    </span>
                  )}
                </button>
              </div>
            ) : null
          }
        />
      )}

      {activeTab === "documents" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("apercu")}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all"
              >
                ← Retour au détail du dossier
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("documents")}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>Documents</span>
                {totalFichiers > 0 && (
                  <span className="rounded-full bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                    {totalFichiers}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("suivi")}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all flex items-center gap-1.5"
              >
                <span>Suivi & Écritures</span>
                {suiviCount > 0 && (
                  <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    {suiviCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <DossierDetailDocuments
            dossierId={currentDossier.id}
            clientId={currentDossier.clientId}
            dossierFichiers={dossierFichiers}
            subDossiers={subDossiers}
            fichiersBySubDossier={fichiersBySubDossier}
            onCreateSubDossier={openCreateSubDossier}
            onEditSubDossier={openEditSubDossier}
            onDeleteSubDossier={setSubDossierDeleteId}
            addFichier={addFichier}
            deleteFichier={deleteFichier}
            canWrite={canWrite}
            onStartOcr={handleStartOcr}
          />
        </div>
      )}

      {activeTab === "suivi" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("apercu")}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all"
              >
                ← Retour au détail du dossier
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("documents")}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all flex items-center gap-1.5"
              >
                <span>Documents</span>
                {totalFichiers > 0 && (
                  <span className="rounded-full bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                    {totalFichiers}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("suivi")}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>Suivi & Écritures</span>
                {suiviCount > 0 && (
                  <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    {suiviCount}
                  </span>
                )}
              </button>
            </div>
          </div>

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
            canWrite={canWrite}
          />
        </div>
      )}

      {nextTransition && (
        <TransitionDialog
          dossier={currentDossier}
          transition={nextTransition}
          open={transitionOpen}
          onOpenChange={setTransitionOpen}
        />
      )}

      <OcrReviewDialogLazy
        open={!!ocrDocumentId}
        onOpenChange={(o) => !o && setOcrDocumentId(null)}
        documentId={ocrDocumentId}
        existingDossierId={currentDossier.id}
        defaultClientId={currentDossier.clientId}
      />

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
              <Label htmlFor="sd-nom" className="text-sm font-medium text-foreground/90">
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
                  if (event.key === "Enter") void handleSaveSubDossier();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sd-desc" className="text-sm font-medium text-foreground/90">
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
            <Button onClick={() => void handleSaveSubDossier()} disabled={!subDossierName.trim() || savingSubDossier}>
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
              onClick={() => void handleDeleteSubDossier()}
              disabled={deletingSubDossier}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={fournisseurDialogOpen} onOpenChange={setFournisseurDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un fournisseur</DialogTitle>
            <DialogDescription>
              Rattachez un fournisseur ou transporteur et son coût à ce dossier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground/90">
                Fournisseur <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedFournisseurId} onValueChange={setSelectedFournisseurId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Sélectionner un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {fournisseurs.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
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
              <Label className="text-sm font-medium text-foreground/90">
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
                <Label className="text-sm font-medium text-foreground/90">
                  Montant budgété (FCFA)
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={fournisseurBudgetAmount}
                  onChange={(event) => setFournisseurBudgetAmount(event.target.value)}
                  placeholder={UI.placeholders.amountFCFA}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground/90">
                  Montant réel (FCFA)
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={fournisseurActualAmount}
                  onChange={(event) => setFournisseurActualAmount(event.target.value)}
                  placeholder={UI.placeholders.amountFCFA}
                  className="h-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground/90">Date</Label>
                <Input
                  type="date"
                  value={fournisseurDate}
                  onChange={(event) => setFournisseurDate(event.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground/90">Statut</Label>
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
            <Button onClick={() => void handleSaveDossierFournisseur()} disabled={!selectedFournisseurId || savingFournisseur}>
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

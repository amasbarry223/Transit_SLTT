"use client";

import { useState, useRef, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  ArrowLeft,
  Pencil,
  FileText,
  Receipt,
  Check,
  MessageSquare,
  Send,
  Trash2,
  CheckCircle2,
  Info,
  Plus,
  Upload,
  Download,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Folder,
  FolderPlus,
  FolderOpen,
  Wallet,
  History,
  Clock,
  CalendarClock,
  CalendarCheck2,
  AlertTriangle,
  ShieldCheck,
  SquareCheckBig,
  Truck,
  Receipt as ReceiptIcon,
} from "lucide-react";
import { useNav } from "@/lib/nav-store";
import { useStore, CHECKLIST_DOCS } from "@/lib/store";
import type {
  SubDossierInput,
  FichierInput,
  SubDossier,
  DossierFichier,
  DossierComment,
  FournisseurType,
  DossierFournisseurInput,
} from "@/lib/store";
import { calculerEcart } from "@/lib/mock-data";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { printHTML } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";
import {
  DossierStatutBadge,
  EcartValue,
  EcritureStatutBadge,
  DossierFournisseurStatutBadge,
  FactureStatutBadge,
} from "@/components/sltt/status-badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  TRANSITION_META,
} from "@/components/sltt/dossier-transition-dialog";
import { cn } from "@/lib/utils";
import type { DossierStatut } from "@/lib/store";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 Mo

const STATUTS_ORDERED: DossierStatut[] = [
  "En cours",
  "Dédouané",
  "Livré",
  "Soldé",
];

/* ------------------------------------------------------------------ */
/* Utilities                                                           */
/* ------------------------------------------------------------------ */

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getFileIconComponent(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType === "application/pdf") return FileText;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  )
    return FileSpreadsheet;
  return File;
}

/* ------------------------------------------------------------------ */
/* Stepper                                                             */
/* ------------------------------------------------------------------ */

function DossierStepper({ statut }: { statut: DossierStatut }) {
  const currentIdx = STATUTS_ORDERED.indexOf(statut);
  return (
    <div role="list" aria-label="Progression du dossier" className="flex items-start">
      {STATUTS_ORDERED.map((s, i) => {
        const done = currentIdx > i;
        const active = currentIdx === i;
        const isLast = i === STATUTS_ORDERED.length - 1;
        return (
          <div
            key={s}
            role="listitem"
            aria-current={active ? "step" : undefined}
            aria-label={done ? `${s} — complété` : undefined}
            className={cn("flex flex-col items-center", !isLast && "flex-1")}
          >
            <div className="flex w-full items-center">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  done
                    ? "bg-primary text-white"
                    : active
                    ? "bg-primary text-white ring-4 ring-primary/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500",
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "h-0.5 flex-1 transition-colors",
                    done ? "bg-primary" : "bg-slate-200 dark:bg-slate-700",
                  )}
                />
              )}
            </div>
            <span
              className={cn(
                "mt-2 text-xs",
                !isLast && "w-full pr-4",
                active
                  ? "font-semibold text-primary"
                  : done
                  ? "text-slate-600 dark:text-slate-300"
                  : "text-slate-400 dark:text-slate-500",
              )}
            >
              {s}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Info rows                                                           */
/* ------------------------------------------------------------------ */

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <span className="shrink-0 text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900 dark:text-slate-100">
        {value || "—"}
      </span>
    </div>
  );
}

function AmountRow({
  label,
  value,
  tone,
  size = "sm",
}: {
  label: string;
  value: number;
  tone?: "emerald" | "amber" | "red";
  size?: "sm" | "lg";
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <span
        className={cn(
          "shrink-0 text-sm",
          tone ? "font-medium" : "text-slate-500 dark:text-slate-400",
          tone === "emerald" && "text-emerald-700 dark:text-emerald-400",
          tone === "amber" && "text-amber-700",
          tone === "red" && "text-red-600 dark:text-red-400",
          !tone && "text-slate-500 dark:text-slate-400",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-semibold tabular-nums",
          size === "lg" ? "text-xl" : "text-sm",
          tone === "emerald"
            ? "text-emerald-700 dark:text-emerald-400"
            : tone === "amber"
            ? "text-amber-700"
            : tone === "red"
            ? "text-red-600 dark:text-red-400"
            : "text-slate-900 dark:text-slate-100",
        )}
      >
        {formatFCFA(value)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* File Drop Zone                                                      */
/* ------------------------------------------------------------------ */

function FileDropZone({
  dossierId,
  sousDossierId,
  fichiers,
  onUpload,
  onDelete,
}: {
  dossierId: string;
  sousDossierId?: string;
  fichiers: DossierFichier[];
  onUpload: (input: FichierInput) => void;
  onDelete: (id: string) => void;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function processFiles(fileList: FileList | null) {
    if (!fileList) return;
    Array.from(fileList).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Fichier trop volumineux",
          description: `${file.name} dépasse la limite de 2 Mo.`,
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        onUpload({
          dossierId,
          sousDossierId,
          nom: file.name,
          taille: file.size,
          type: file.type || "application/octet-stream",
          dataUrl: ev.target?.result as string,
        });
        toast({
          title: "Fichier ajouté",
          description: file.name,
        });
      };
      reader.readAsDataURL(file);
    });
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    processFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  }

  function handleDownload(f: DossierFichier) {
    const a = document.createElement("a");
    a.href = f.dataUrl;
    a.download = f.nom;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Cliquer ou déposer des fichiers ici pour les joindre au dossier"
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/60",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <Upload
          className={cn(
            "size-7 transition-colors",
            dragging ? "text-primary" : "text-slate-300 dark:text-slate-700",
          )}
        />
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Déposer des fichiers ici
          </p>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            ou cliquer pour sélectionner · Max 2 Mo par fichier
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          onChange={handleInputChange}
        />
      </div>

      {fichiers.length > 0 && (
        <div className="space-y-1.5">
          {fichiers.map((f) => {
            const Icon = getFileIconComponent(f.type);
            return (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-white dark:bg-slate-900 px-3 py-2.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/60"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <Icon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {f.nom}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatFileSize(f.taille)} ·{" "}
                    {formatDateShort(f.dateUpload)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-slate-400 dark:text-slate-500 hover:text-primary"
                    title="Télécharger"
                    aria-label={`Télécharger ${f.nom}`}
                    onClick={() => handleDownload(f)}
                  >
                    <Download className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-slate-400 dark:text-slate-500 hover:text-destructive"
                    title="Supprimer"
                    aria-label={`Supprimer le fichier ${f.nom}`}
                    onClick={() => onDelete(f.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {fichiers.length === 0 && (
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">Aucun fichier</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-dossier card                                                    */
/* ------------------------------------------------------------------ */

function SubDossierCard({
  sd,
  fichiers,
  onEdit,
  onDelete,
  addFichier,
  deleteFichier,
}: {
  sd: SubDossier;
  fichiers: DossierFichier[];
  onEdit: () => void;
  onDelete: () => void;
  addFichier: (input: FichierInput) => void;
  deleteFichier: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white dark:bg-slate-900 shadow-sm">
      <div
        className="flex cursor-pointer items-center gap-3 px-4 py-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/60"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-primary">
          {expanded ? (
            <FolderOpen className="size-4" />
          ) : (
            <Folder className="size-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-900 dark:text-slate-100">{sd.nom}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Créé le {formatDateShort(sd.dateCreation)} ·{" "}
            <span className="font-medium">
              {fichiers.length} fichier{fichiers.length !== 1 ? "s" : ""}
            </span>
          </p>
        </div>
        {sd.description && (
          <p className="hidden max-w-[180px] truncate text-xs text-slate-400 dark:text-slate-500 sm:block">
            {sd.description}
          </p>
        )}
        <div
          className="flex shrink-0 items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-slate-400 dark:text-slate-500 hover:text-primary"
            title="Renommer"
            aria-label={`Renommer le sous-dossier ${sd.nom}`}
            onClick={onEdit}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-slate-400 dark:text-slate-500 hover:text-destructive"
            title="Supprimer"
            aria-label={`Supprimer le sous-dossier ${sd.nom}`}
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
        {expanded ? (
          <ChevronUp className="size-4 shrink-0 text-slate-400 dark:text-slate-500" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-slate-400 dark:text-slate-500" />
        )}
      </div>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {sd.description && (
            <p className="mb-3 text-sm text-slate-600 dark:text-slate-300 sm:hidden">
              {sd.description}
            </p>
          )}
          <FileDropZone
            dossierId={sd.dossierId}
            sousDossierId={sd.id}
            fichiers={fichiers}
            onUpload={addFichier}
            onDelete={deleteFichier}
          />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main screen                                                         */
/* ------------------------------------------------------------------ */

export function DossierDetailScreen() {
  const { selectedId, go, openDossier } = useNav();
  const { toast } = useToast();

  const dossier = useStore((s) => s.dossiers.find((d) => d.id === selectedId));
  const client = useStore((s) => s.clients.find((c) => c.id === dossier?.clientId));
  const addComment = useStore((s) => s.addComment);
  const deleteComment = useStore((s) => s.deleteComment);
  const currentUserName = useNav((s) => s.currentUserName);
  const addSubDossier = useStore((s) => s.addSubDossier);
  const updateSubDossier = useStore((s) => s.updateSubDossier);
  const deleteSubDossier = useStore((s) => s.deleteSubDossier);
  const addFichier = useStore((s) => s.addFichier);
  const deleteFichier = useStore((s) => s.deleteFichier);
  const updateDossierChecklist = useStore((s) => s.updateDossierChecklist);
  const fournisseurs = useStore(useShallow((s) => s.fournisseurs));
  const addDossierFournisseur = useStore((s) => s.addDossierFournisseur);
  // PERF-01: subscribe only to relevant slice for this dossier
  const dossierId = selectedId ?? "";
  const dossierFournisseurs = useStore(useShallow((s) => s.dossierFournisseurs.filter((df) => df.dossierId === dossierId)));
  const allSubDossiers = useStore(useShallow((s) => s.subDossiers.filter((sd) => sd.dossierId === dossierId)));
  const allComments = useStore(useShallow((s) => s.comments.filter((c) => c.dossierId === dossierId)));
  const allFichiers = useStore(useShallow((s) => s.fichiers.filter((f) => f.dossierId === dossierId)));
  const allEcritures = useStore(useShallow((s) => s.ecritures.filter((e) => e.dossierId === dossierId)));
  const auditLogs = useStore(useShallow((s) => s.auditLogs));
  const dossierFactures = useStore(useShallow((s) => s.factures.filter((f) => f.dossierId === dossierId)));

  const [transitionOpen, setTransitionOpen] = useState(false);
  const [commentText, setCommentText] = useState("");

  // Sub-dossier dialog states
  const [sdDialogOpen, setSdDialogOpen] = useState(false);
  const [sdEditId, setSdEditId] = useState<string | null>(null);
  const [sdNom, setSdNom] = useState("");
  const [sdDesc, setSdDesc] = useState("");

  // Sub-dossier delete confirmation
  const [sdDeleteId, setSdDeleteId] = useState<string | null>(null);

  // Dossier ↔ Fournisseur link dialog
  const [dfDialogOpen, setDfDialogOpen] = useState(false);
  const [dfFournisseurId, setDfFournisseurId] = useState("");
  const [dfDescription, setDfDescription] = useState("");
  const [dfMontantBudgete, setDfMontantBudgete] = useState("");
  const [dfMontantReel, setDfMontantReel] = useState("");
  const [dfStatut, setDfStatut] = useState<"En attente" | "Payé" | "Litige">("En attente");
  const [dfDate, setDfDate] = useState(() => new Date().toISOString().slice(0, 10));

  // allSubDossiers, allFichiers, allComments, allEcritures are already filtered by dossierId (PERF-01)
  const subDossiers = allSubDossiers;

  const dossierFichiers = useMemo(
    () => allFichiers.filter((f) => !f.sousDossierId),
    [allFichiers],
  );

  // BUG-04: build a Map once instead of calling subFichiersOf(sdId) per render
  const fichiersBySubDossier = useMemo(() => {
    const map = new Map<string, typeof allFichiers>();
    allFichiers.forEach((f) => {
      if (f.sousDossierId) {
        if (!map.has(f.sousDossierId)) map.set(f.sousDossierId, []);
        map.get(f.sousDossierId)!.push(f);
      }
    });
    return map;
  }, [allFichiers]);

  const totalFichiers = allFichiers.length;

  const dossierEcritures = allEcritures;

  const dossierComments = allComments;

  // PERF-03: use regex with word boundary to avoid false positives
  const dossierAuditLogs = useMemo(() => {
    if (!dossier) return [];
    const refEscaped = dossier.reference.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const refRegex = new RegExp(`\\b${refEscaped}\\b`);
    return auditLogs.filter((a) => refRegex.test(a.detail));
  }, [auditLogs, dossier?.reference]);

  if (!dossier) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex size-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
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

  const nextTransition = getNextTransition(dossier.statut);
  const ecart = calculerEcart(dossier);
  const reste = Math.max(0, dossier.montantInvesti - dossier.montantPaye);

  // Échéance
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const echeanceDate = dossier.dateEcheance ? new Date(dossier.dateEcheance) : null;
  const joursRestants = echeanceDate ? Math.ceil((echeanceDate.getTime() - today.getTime()) / 86400000) : null;
  const echeanceDepassee = joursRestants !== null && joursRestants < 0;
  const echeanceImminente = joursRestants !== null && joursRestants >= 0 && joursRestants <= 3;

  // Checklist progression
  const checklistChecked = dossier.checklistDocs ?? [];
  const checklistTotal = CHECKLIST_DOCS.length;
  const checklistDone = checklistChecked.length;

  /* ---------- Handlers ---------- */

  function openCreateSubDossier() {
    setSdEditId(null);
    setSdNom("");
    setSdDesc("");
    setSdDialogOpen(true);
  }

  function openEditSubDossier(sd: SubDossier) {
    setSdEditId(sd.id);
    setSdNom(sd.nom);
    setSdDesc(sd.description ?? "");
    setSdDialogOpen(true);
  }

  function handleSaveSubDossier() {
    const nom = sdNom.trim();
    if (!nom) return;
    if (sdEditId) {
      updateSubDossier(sdEditId, nom, sdDesc.trim() || undefined);
      toast({ title: "Sous-dossier modifié", description: nom });
    } else {
      addSubDossier({ dossierId: dossierId, nom, description: sdDesc.trim() || undefined });
      toast({ title: "Sous-dossier créé", description: nom });
    }
    setSdDialogOpen(false);
  }

  function handleDeleteSubDossier() {
    if (!sdDeleteId) return;
    const sd = subDossiers.find((s) => s.id === sdDeleteId);
    deleteSubDossier(sdDeleteId);
    setSdDeleteId(null);
    toast({
      title: "Sous-dossier supprimé",
      description: sd?.nom,
    });
  }

  function openAddFournisseur() {
    setDfFournisseurId("");
    setDfDescription("");
    setDfMontantBudgete("");
    setDfMontantReel("");
    setDfStatut("En attente");
    setDfDate(new Date().toISOString().slice(0, 10));
    setDfDialogOpen(true);
  }

  function handleSaveDossierFournisseur() {
    if (!dossier || !dfFournisseurId) return;
    const f = fournisseurs.find((x) => x.id === dfFournisseurId);
    if (!f) return;
    const input: DossierFournisseurInput = {
      dossierId: dossier.id,
      dossierRef: dossier.reference,
      fournisseurId: f.id,
      fournisseurNom: f.nom,
      type: f.type as FournisseurType,
      description: dfDescription.trim(),
      montantBudgete: dfMontantBudgete ? parseFloat(dfMontantBudgete) : 0,
      montantReel: dfMontantReel ? parseFloat(dfMontantReel) : 0,
      statut: dfStatut,
      date: dfDate,
    };
    addDossierFournisseur(input);
    setDfDialogOpen(false);
    toast({ title: "Prestataire lié au dossier", description: f.nom });
  }

  function handleInvoice() {
    if (!dossier) return;
    // Naviguer vers le module Factures avec le dossier pré-rempli
    go("factures", { id: dossier.id });
  }

  function handlePdf() {
    if (!dossier) return;
    const d = dossier;
    printHTML(
      `Dossier ${d.reference}`,
      `
      <h1>Dossier de transit</h1>
      <div class="subtitle">Référence : <strong>${d.reference}</strong> · Statut : ${d.statut}</div>
      <table>
        <tbody>
          <tr><th style="width:35%">Client</th><td>${d.clientNom}</td></tr>
          <tr><th>Nature de la marchandise</th><td>${d.nature || "—"}</td></tr>
          <tr><th>N° de BL</th><td>${d.bl || "—"}</td></tr>
          <tr><th>N° du camion</th><td>${d.camion || "—"}</td></tr>
          <tr><th>Date</th><td>${d.date ? formatDateShort(d.date) : "—"}</td></tr>
        </tbody>
      </table>
      <h2 style="margin-top:24px;font-size:14px;color:#1e40af">Montants (FCFA)</h2>
      <table>
        <tbody>
          <tr><th style="width:35%">Droit de douane</th><td class="num">${formatFCFA(d.droitDouane, false)}</td></tr>
          <tr><th>Frais de circuit global</th><td class="num">${formatFCFA(d.fraisCircuit, false)}</td></tr>
          <tr><th>Frais de prestation</th><td class="num">${formatFCFA(d.fraisPrestation, false)}</td></tr>
          <tr><th>Montant investi</th><td class="num">${formatFCFA(d.montantInvesti, false)}</td></tr>
          <tr><th>Montant payé</th><td class="num">${formatFCFA(d.montantPaye, false)}</td></tr>
          <tr><th>Reste à payer</th><td class="num">${formatFCFA(reste, false)}</td></tr>
          <tr class="total-row">
            <th>Écart calculé</th>
            <td class="num" style="color:${ecart >= 0 ? "#059669" : "#dc2626"}">
              ${ecart >= 0 ? "+" : ""}${ecart.toLocaleString("fr-FR")}
            </td>
          </tr>
        </tbody>
      </table>
      ${d.notes ? `<h2 style="margin-top:24px;font-size:14px;color:#1e40af">Notes</h2><p style="font-size:13px;color:#475569;white-space:pre-wrap">${d.notes}</p>` : ""}
      ${subDossiers.length > 0 ? `<h2 style="margin-top:24px;font-size:14px;color:#1e40af">Sous-dossiers (${subDossiers.length})</h2><ul style="font-size:13px;color:#475569">${subDossiers.map((sd) => `<li>${sd.nom}${sd.description ? ` — ${sd.description}` : ""}</li>`).join("")}</ul>` : ""}
    `,
    );
    toast({
      title: "PDF généré",
      description: "Le document s'est ouvert dans une nouvelle fenêtre.",
    });
  }

  /* ---------- Render ---------- */

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        className="-ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        onClick={() => go("dossiers")}
      >
        <ArrowLeft className="size-4" />
        ← Liste
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {dossier.reference}
          </h1>
          <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 font-mono text-xs text-slate-500 dark:text-slate-400">
            {dossier.clientNom}
          </span>
          <DossierStatutBadge statut={dossier.statut} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleInvoice}>
            <Receipt className="size-4" />
            Facture
          </Button>
          <Button variant="outline" onClick={handlePdf}>
            <FileText className="size-4" />
            PDF
          </Button>
          <Button onClick={() => openDossier(dossier.id, "edit")}>
            <Pencil className="size-4" />
            Modifier
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <Card className="border-border/80 p-5 shadow-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Progression du dossier
        </p>
        <DossierStepper statut={dossier.statut} />
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="informations">
        <TabsList className="mb-4 h-10">
          <TabsTrigger value="informations">Informations</TabsTrigger>
          <TabsTrigger value="documents">
            Documents
            <span className={cn(
              "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              checklistDone === checklistTotal
                ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                : "bg-primary/10 text-primary"
            )}>
              {checklistDone}/{checklistTotal}
            </span>
          </TabsTrigger>
          <TabsTrigger value="sous-dossiers">
            Sous-dossiers
            {subDossiers.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {subDossiers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="paiements">
            Paiements
            {dossierEcritures.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {dossierEcritures.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="factures">
            Factures
            {dossierFactures.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {dossierFactures.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="fournisseurs">
            Fournisseurs
            {dossierFournisseurs.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {dossierFournisseurs.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="discussion">
            Discussion
            {dossierComments.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {dossierComments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        {/* ---- TAB: Informations ---- */}
        <TabsContent value="informations">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* General info */}
              <Card className="border-border/80 p-5 shadow-sm">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Informations générales
                </h2>
                <InfoRow label="Client" value={dossier.clientNom} />
                <InfoRow label="Nature de la marchandise" value={dossier.nature} />
                <InfoRow
                  label="N° de BL"
                  value={<span className="font-mono text-slate-700 dark:text-slate-300">{dossier.bl}</span>}
                />
                <InfoRow
                  label="N° du camion"
                  value={<span className="font-mono text-slate-700 dark:text-slate-300">{dossier.camion}</span>}
                />
                {dossier.modeTransport && (
                  <InfoRow label="Mode de transport" value={dossier.modeTransport} />
                )}
                {dossier.portEntree && (
                  <InfoRow label="Port / Frontière d'entrée" value={dossier.portEntree} />
                )}
                {dossier.noConteneur && (
                  <InfoRow label="N° conteneur" value={<span className="font-mono text-slate-700 dark:text-slate-300">{dossier.noConteneur}</span>} />
                )}
                {dossier.poidsTotal && (
                  <InfoRow label="Poids total" value={`${dossier.poidsTotal.toLocaleString("fr-FR")} kg`} />
                )}
                <InfoRow
                  label="Date d'ouverture"
                  value={dossier.date ? formatDateShort(dossier.date) : "—"}
                />
                {dossier.dateEcheance && (
                  <InfoRow
                    label="Date d'échéance"
                    value={
                      <span className={cn(
                        "flex items-center gap-1.5 font-medium",
                        echeanceDepassee ? "text-red-600 dark:text-red-400" : echeanceImminente ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-300"
                      )}>
                        {echeanceDepassee ? <AlertTriangle className="size-3.5" /> : <CalendarClock className="size-3.5" />}
                        {formatDateShort(dossier.dateEcheance)}
                        {echeanceDepassee && <span className="text-xs font-normal">(dépassée de {Math.abs(joursRestants!)}j)</span>}
                        {echeanceImminente && <span className="text-xs font-normal">({joursRestants}j restants)</span>}
                      </span>
                    }
                  />
                )}
                {dossier.dateDedouanement && (
                  <InfoRow
                    label="Date de dédouanement"
                    value={
                      <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                        <CalendarCheck2 className="size-3.5" />
                        {formatDateShort(dossier.dateDedouanement)}
                      </span>
                    }
                  />
                )}
              </Card>

              {/* Alerte échéance dépassée */}
              {echeanceDepassee && (
                <Card className="border-l-4 border-l-red-500 border-border/80 p-4 shadow-sm bg-red-50/60 dark:bg-red-950/30">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="size-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">Échéance dépassée</p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                        La date limite du {formatDateShort(dossier.dateEcheance!)} est dépassée de {Math.abs(joursRestants!)} jour{Math.abs(joursRestants!) > 1 ? "s" : ""}. Des surestaries peuvent s'appliquer.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
              {echeanceImminente && !echeanceDepassee && (
                <Card className="border-l-4 border-l-amber-500 border-border/80 p-4 shadow-sm bg-amber-50/60 dark:bg-amber-950/30">
                  <div className="flex items-start gap-3">
                    <CalendarClock className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Échéance imminente</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                        Il reste {joursRestants} jour{joursRestants! > 1 ? "s" : ""} avant la date limite du {formatDateShort(dossier.dateEcheance!)}.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Notes */}
              {dossier.notes && (
                <Card className="border-border/80 p-5 shadow-sm">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Notes
                  </h2>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {dossier.notes}
                  </p>
                </Card>
              )}

              {/* Next action */}
              {nextTransition ? (
                (() => {
                  const meta = TRANSITION_META[nextTransition];
                  const Icon = meta.icon;
                  return (
                    <Card
                      className={cn(
                        "border-border/80 border-l-4 p-5 shadow-sm",
                        meta.borderClass,
                      )}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-lg",
                              meta.bgClass,
                              meta.colorClass,
                            )}
                          >
                            <Icon className="size-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              Action suivante
                            </p>
                            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                              {meta.actionDescription}
                            </p>
                          </div>
                        </div>
                        <Button
                          className="shrink-0 self-start"
                          onClick={() => setTransitionOpen(true)}
                        >
                          {meta.confirmLabel}
                        </Button>
                      </div>
                    </Card>
                  );
                })()
              ) : (
                <Card className="border-border/80 border-l-4 border-l-emerald-500 p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Dossier clôturé
                      </p>
                      <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                        Ce dossier est soldé. Tous les paiements ont été enregistrés.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Right — financial summary */}
            <div className="lg:col-span-1">
              <div className="space-y-4 lg:sticky lg:top-24">
                <Card className="border-border/80 p-5 shadow-sm">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Récapitulatif financier
                  </h2>
                  <AmountRow label="Droit de douane" value={dossier.droitDouane} />
                  <AmountRow label="Frais de circuit" value={dossier.fraisCircuit} />
                  <AmountRow label="Frais de prestation" value={dossier.fraisPrestation} />
                  <Separator className="my-1" />
                  <AmountRow label="Montant investi" value={dossier.montantInvesti} />
                  <AmountRow label="Montant payé" value={dossier.montantPaye} tone="emerald" />
                  <AmountRow
                    label="Reste à payer"
                    value={reste}
                    tone={reste > 0 ? "amber" : "emerald"}
                  />
                  <div className="mt-4 border-t border-border pt-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Écart calculé</span>
                      <EcartValue value={ecart} />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                      Prestation − (Douane + Circuit)
                    </p>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex flex-col gap-2">
                    <Button className="w-full" onClick={() => openDossier(dossier.id, "edit")}>
                      <Pencil className="size-4" />
                      Modifier le dossier
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handlePdf}>
                      <FileText className="size-4" />
                      Générer le PDF
                    </Button>
                  </div>
                </Card>

                {/* Rentabilité */}
                <Card className="border-border/80 p-5 shadow-sm">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Rentabilité</h2>
                  {(() => {
                    const recettes = dossier.fraisPrestation;
                    const charges  = dossier.droitDouane + dossier.fraisCircuit;
                    const marge    = recettes - charges;
                    const tauxMarge = recettes > 0 ? Math.round((marge / recettes) * 100) : 0;
                    const tauxRec   = dossier.montantInvesti > 0 ? Math.round((dossier.montantPaye / dossier.montantInvesti) * 100) : 0;
                    return (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Recettes (prestation)</span>
                            <span className="font-semibold tabular-nums">{formatFCFA(recettes)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Charges (douane + circuit)</span>
                            <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">−{formatFCFA(charges)}</span>
                          </div>
                          <Separator className="my-1" />
                          <div className="flex justify-between text-sm font-semibold">
                            <span>Marge brute</span>
                            <span className={marge >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                              {marge >= 0 ? "+" : ""}{formatFCFA(marge)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Taux de marge</span>
                            <span className={cn("font-semibold tabular-nums", marge >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                              {tauxMarge}%
                            </span>
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Recouvrement</span>
                            <span className="font-semibold tabular-nums">{tauxRec}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className={cn("h-full rounded-full transition-all", tauxRec >= 100 ? "bg-emerald-500" : "bg-blue-500")}
                              style={{ width: `${Math.min(100, tauxRec)}%` }}
                            />
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </Card>

                {/* Quick stats */}
                <Card className="border-border/80 p-5 shadow-sm">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Contenu du dossier
                  </h2>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Folder className="size-3.5" />
                        Sous-dossiers
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{subDossiers.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <File className="size-3.5" />
                        Fichiers joints
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{totalFichiers}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ---- TAB: Documents ---- */}
        <TabsContent value="documents">
          <div className="space-y-4">
            {/* Checklist documentaire */}
            <Card className="border-border/80 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Checklist documentaire</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Documents standards d'un dossier de transit</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{checklistDone}/{checklistTotal}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">reçus</p>
                </div>
              </div>
              {/* Barre de progression */}
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    checklistDone === checklistTotal ? "bg-emerald-500" : "bg-blue-500"
                  )}
                  style={{ width: `${Math.round((checklistDone / checklistTotal) * 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CHECKLIST_DOCS.map((doc) => {
                  const isChecked = checklistChecked.includes(doc.id);
                  return (
                    <button
                      key={doc.id}
                      onClick={() => updateDossierChecklist(dossier.id, doc.id, !isChecked)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                        isChecked
                          ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800"
                          : "border-border bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      <div className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded",
                        isChecked ? "bg-emerald-500 text-white" : "border border-slate-300 bg-white dark:bg-slate-900"
                      )}>
                        {isChecked && <Check className="size-3" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium">{doc.label}</span>
                        {doc.obligatoire && !isChecked && (
                          <span className="ml-1.5 text-[10px] text-red-500">obligatoire</span>
                        )}
                      </div>
                      {isChecked && <SquareCheckBig className="size-4 shrink-0 text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
              {checklistDone === checklistTotal && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-3 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <p className="text-sm font-medium">Tous les documents ont été reçus.</p>
                </div>
              )}
            </Card>

            {/* Fichiers uploadés */}
            <Card className="border-border/80 p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Fichiers joints
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Déposez les documents numérisés liés à ce dossier
                  </p>
                </div>
              </div>
              <FileDropZone
                dossierId={dossier.id}
                fichiers={dossierFichiers}
                onUpload={addFichier}
                onDelete={deleteFichier}
              />
            </Card>
          </div>
        </TabsContent>

        {/* ---- TAB: Sous-dossiers ---- */}
        <TabsContent value="sous-dossiers">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Sous-dossiers ({subDossiers.length})
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Organisez vos documents par catégorie ou par étape
                </p>
              </div>
              <Button onClick={openCreateSubDossier}>
                <FolderPlus className="size-4" />
                Nouveau sous-dossier
              </Button>
            </div>

            {/* Empty state */}
            {subDossiers.length === 0 && (
              <Card className="border-border/80 shadow-sm">
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                    <FolderOpen className="size-7" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Aucun sous-dossier
                  </h3>
                  <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">
                    Créez des sous-dossiers pour organiser vos documents : BL, douane,
                    livraison…
                  </p>
                  <Button className="mt-1" onClick={openCreateSubDossier}>
                    <FolderPlus className="size-4" />
                    Créer un sous-dossier
                  </Button>
                </div>
              </Card>
            )}

            {/* Sub-dossier cards */}
            {subDossiers.map((sd) => (
              <SubDossierCard
                key={sd.id}
                sd={sd}
                fichiers={fichiersBySubDossier.get(sd.id) ?? []}
                onEdit={() => openEditSubDossier(sd)}
                onDelete={() => setSdDeleteId(sd.id)}
                addFichier={addFichier}
                deleteFichier={deleteFichier}
              />
            ))}
          </div>
        </TabsContent>

        {/* ---- TAB: Paiements ---- */}
        <TabsContent value="paiements">
          <Card className="border-border/80 p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <Wallet className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Paiements liés à ce dossier
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Écritures comptables enregistrées pour {dossier.reference}
                </p>
              </div>
            </div>

            {dossierEcritures.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Wallet className="size-10 text-slate-200 dark:text-slate-700" />
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Aucun paiement enregistré pour ce dossier.
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Les paiements apparaissent ici lors du passage en statut Soldé ou via la comptabilité.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table aria-label="Historique des écritures du dossier">
                  <TableHeader>
                    <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Date
                      </TableHead>
                      <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Investi
                      </TableHead>
                      <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Payé
                      </TableHead>
                      <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Reste dû
                      </TableHead>
                      <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:table-cell">
                        Mode
                      </TableHead>
                      <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Statut
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dossierEcritures.map((e) => {
                      const resteE = Math.max(0, e.montantInvesti - e.montantPaye);
                      const statut: "Soldé" | "En attente" = resteE === 0 ? "Soldé" : "En attente";
                      return (
                        <TableRow
                          key={e.id}
                          className="border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60"
                        >
                          <TableCell className="px-4 py-3.5 tabular-nums text-slate-600 dark:text-slate-300">
                            {formatDateShort(e.date)}
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                            {formatFCFA(e.montantInvesti)}
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-right tabular-nums font-medium text-emerald-700 dark:text-emerald-400">
                            {formatFCFA(e.montantPaye)}
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-right tabular-nums">
                            {resteE > 0 ? (
                              <span className="font-semibold text-amber-600 dark:text-amber-400">
                                {formatFCFA(resteE)}
                              </span>
                            ) : (
                              <span className="text-sm text-emerald-600 dark:text-emerald-400">Soldé</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300 sm:table-cell">
                            {e.modePaiement}
                          </TableCell>
                          <TableCell className="px-4 py-3.5">
                            <EcritureStatutBadge statut={statut} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ---- TAB: Factures ---- */}
        <TabsContent value="factures">
          <Card className="border-border/80 p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <ReceiptIcon className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Factures liées à ce dossier
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Émises séparément dans le module Factures — indépendant des écritures ci-dessus
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleInvoice}>
                <ReceiptIcon className="size-4" />
                Nouvelle facture
              </Button>
            </div>

            {dossierFactures.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ReceiptIcon className="size-10 text-slate-200 dark:text-slate-700" />
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Aucune facture émise pour ce dossier.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table aria-label="Factures du dossier">
                  <TableHeader>
                    <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Numéro
                      </TableHead>
                      <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Date
                      </TableHead>
                      <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Montant TTC
                      </TableHead>
                      <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Payé
                      </TableHead>
                      <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Statut
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dossierFactures.map((f) => (
                      <TableRow
                        key={f.id}
                        className="cursor-pointer border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60"
                        onClick={() => go("facture-detail", { id: f.id })}
                      >
                        <TableCell className="px-4 py-3.5 font-mono text-xs font-semibold text-blue-700">
                          {f.numero}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 tabular-nums text-slate-600 dark:text-slate-300">
                          {formatDateShort(f.date)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {formatFCFA(f.montantTTC)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right tabular-nums font-medium text-emerald-700 dark:text-emerald-400">
                          {formatFCFA(f.montantPaye)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <FactureStatutBadge statut={f.statut} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ---- TAB: Fournisseurs ---- */}
        <TabsContent value="fournisseurs">
          <Card className="border-border/80 p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  <Truck className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Fournisseurs & sous-traitants
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Coûts de sous-traitance imputés à {dossier.reference}
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={openAddFournisseur}>
                <Plus className="size-4" />
                Ajouter un prestataire
              </Button>
            </div>

            {dossierFournisseurs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Truck className="size-10 text-slate-200 dark:text-slate-700" />
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Aucun fournisseur lié à ce dossier.
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Ajoutez un transporteur, un commissionnaire ou un manutentionnaire et son coût réel.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table aria-label="Fournisseurs liés au dossier">
                  <TableHeader>
                    <TableRow className="border-b border-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Prestataire
                      </TableHead>
                      <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Description
                      </TableHead>
                      <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Budgété
                      </TableHead>
                      <TableHead className="h-10 px-4 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Réel
                      </TableHead>
                      <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Statut
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dossierFournisseurs.map((df) => (
                      <TableRow key={df.id} className="border-b border-border hover:bg-slate-50/60 dark:hover:bg-slate-800/60">
                        <TableCell className="px-4 py-3.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                          {df.fournisseurNom}
                          <p className="text-xs font-normal text-slate-400 dark:text-slate-500">{df.type}</p>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                          {df.description || "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right tabular-nums text-slate-600 dark:text-slate-300">
                          {formatFCFA(df.montantBudgete)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right tabular-nums font-medium text-slate-800 dark:text-slate-200">
                          {formatFCFA(df.montantReel)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <DossierFournisseurStatutBadge statut={df.statut} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ---- TAB: Discussion ---- */}
        <TabsContent value="discussion">
          <Card className="border-border/80 shadow-sm">
            <div className="p-5 border-b border-border flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <MessageSquare className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Discussion interne</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Notes et échanges entre membres de l&apos;équipe</p>
              </div>
            </div>

            {/* Messages */}
            <div className="min-h-[200px] divide-y divide-border">
              {dossierComments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <MessageSquare className="size-10 text-slate-200 dark:text-slate-700" />
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Aucun message pour ce dossier.</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Soyez le premier à laisser une note.</p>
                </div>
              ) : (
                [...dossierComments].reverse().map((c) => {
                  const isOwn = c.userName === currentUserName;
                  return (
                    <div key={c.id} className="flex items-start gap-3 p-4 group">
                      <div className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                        isOwn ? "bg-gradient-to-br from-blue-600 to-blue-800" : "bg-gradient-to-br from-slate-500 to-slate-700",
                      )}>
                        {c.userName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{c.userName}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {new Date(c.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{c.texte}</p>
                      </div>
                      {isOwn && (
                        <button
                          onClick={() => deleteComment(c.id)}
                          className="shrink-0 p-1 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-red-500 transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-xs font-bold text-white">
                  {currentUserName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="relative flex-1">
                  <Label htmlFor="comment-input" className="sr-only">Nouveau commentaire</Label>
                  <textarea
                    id="comment-input"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        const t = commentText.trim();
                        if (!t) return;
                        addComment(dossierId, t);
                        setCommentText("");
                        toast({ title: "Message envoyé" });
                      }
                    }}
                    placeholder="Écrire un message... (Entrée pour envoyer, Maj+Entrée pour sauter une ligne)"
                    rows={2}
                    className="w-full resize-none rounded-xl border border-border bg-slate-50/60 dark:bg-slate-800/60 px-3 py-2.5 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    onClick={() => {
                      const t = commentText.trim();
                      if (!t) return;
                      addComment(dossierId, t);
                      setCommentText("");
                      toast({ title: "Message envoyé" });
                    }}
                    disabled={!commentText.trim()}
                    className="absolute bottom-2.5 right-2.5 flex size-6 items-center justify-center rounded-lg bg-primary text-white disabled:opacity-30 hover:bg-primary/90 transition-colors"
                  >
                    <Send className="size-3" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ---- TAB: Historique ---- */}
        <TabsContent value="historique">
          <Card className="border-border/80 p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <History className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Historique du dossier
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Toutes les actions enregistrées sur {dossier.reference}
                </p>
              </div>
            </div>

            {dossierAuditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <History className="size-10 text-slate-200 dark:text-slate-700" />
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Aucune action enregistrée pour ce dossier.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {dossierAuditLogs.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 py-3.5">
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      <Clock className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{a.action}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{a.detail}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        {formatDateShort(a.date.slice(0, 10))}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{a.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transition dialog */}
      {nextTransition && (
        <TransitionDialog
          dossier={dossier}
          transition={nextTransition}
          open={transitionOpen}
          onOpenChange={setTransitionOpen}
        />
      )}

      {/* Sub-dossier create/edit dialog */}
      <Dialog open={sdDialogOpen} onOpenChange={setSdDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {sdEditId ? "Modifier le sous-dossier" : "Nouveau sous-dossier"}
            </DialogTitle>
            <DialogDescription>
              {sdEditId
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
                value={sdNom}
                onChange={(e) => setSdNom(e.target.value)}
                placeholder="ex. Documents douane"
                className="h-10"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveSubDossier();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sd-desc" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Description (optionnel)
              </Label>
              <Input
                id="sd-desc"
                value={sdDesc}
                onChange={(e) => setSdDesc(e.target.value)}
                placeholder="Brève description du contenu…"
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSdDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveSubDossier} disabled={!sdNom.trim()}>
              {sdEditId ? (
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

      {/* Sub-dossier delete confirmation */}
      <AlertDialog
        open={!!sdDeleteId}
        onOpenChange={(v) => {
          if (!v) setSdDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce sous-dossier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le sous-dossier{" "}
              <strong>
                {subDossiers.find((s) => s.id === sdDeleteId)?.nom}
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

      {/* Dossier ↔ Fournisseur link dialog */}
      <Dialog open={dfDialogOpen} onOpenChange={setDfDialogOpen}>
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
              <Select value={dfFournisseurId} onValueChange={setDfFournisseurId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Sélectionner un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {fournisseurs.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-slate-400 dark:text-slate-500">
                      Aucun fournisseur — créez-en un dans le module Fournisseurs.
                    </div>
                  ) : (
                    fournisseurs.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nom} · {f.type}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</Label>
              <Input
                value={dfDescription}
                onChange={(e) => setDfDescription(e.target.value)}
                placeholder="ex. Transport Dakar → Bamako"
                className="h-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Montant budgété (FCFA)</Label>
                <Input
                  type="number"
                  value={dfMontantBudgete}
                  onChange={(e) => setDfMontantBudgete(e.target.value)}
                  placeholder="0"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Montant réel (FCFA)</Label>
                <Input
                  type="number"
                  value={dfMontantReel}
                  onChange={(e) => setDfMontantReel(e.target.value)}
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
                  value={dfDate}
                  onChange={(e) => setDfDate(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Statut</Label>
                <Select value={dfStatut} onValueChange={(v) => setDfStatut(v as typeof dfStatut)}>
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
            <Button variant="outline" onClick={() => setDfDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveDossierFournisseur} disabled={!dfFournisseurId}>
              <Check className="size-4" />
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useRef, useMemo } from "react";
import {
  ArrowLeft,
  Pencil,
  FileText,
  Check,
  CheckCircle2,
  Info,
  Plus,
  Trash2,
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
} from "lucide-react";
import { useNav } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import type { SubDossierInput, FichierInput, SubDossier, DossierFichier } from "@/lib/store";
import { calculerEcart } from "@/lib/mock-data";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { printHTML } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";
import { DossierStatutBadge, EcartValue } from "@/components/sltt/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <div className="flex items-start">
      {STATUTS_ORDERED.map((s, i) => {
        const done = currentIdx > i;
        const active = currentIdx === i;
        const isLast = i === STATUTS_ORDERED.length - 1;
        return (
          <div
            key={s}
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
                    : "bg-slate-100 text-slate-400",
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "h-0.5 flex-1 transition-colors",
                    done ? "bg-primary" : "bg-slate-200",
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
                  ? "text-slate-600"
                  : "text-slate-400",
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
      <span className="shrink-0 text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900">
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
          tone ? "font-medium" : "text-slate-500",
          tone === "emerald" && "text-emerald-700",
          tone === "amber" && "text-amber-700",
          tone === "red" && "text-red-600",
          !tone && "text-slate-500",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-semibold tabular-nums",
          size === "lg" ? "text-xl" : "text-sm",
          tone === "emerald"
            ? "text-emerald-700"
            : tone === "amber"
            ? "text-amber-700"
            : tone === "red"
            ? "text-red-600"
            : "text-slate-900",
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
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-slate-50/50",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload
          className={cn(
            "size-7 transition-colors",
            dragging ? "text-primary" : "text-slate-300",
          )}
        />
        <div>
          <p className="text-sm font-medium text-slate-700">
            Déposer des fichiers ici
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
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
                className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2.5 hover:bg-slate-50/60"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Icon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {f.nom}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(f.taille)} ·{" "}
                    {formatDateShort(f.dateUpload)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-slate-400 hover:text-primary"
                    title="Télécharger"
                    onClick={() => handleDownload(f)}
                  >
                    <Download className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-slate-400 hover:text-destructive"
                    title="Supprimer"
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
        <p className="text-center text-xs text-slate-400">Aucun fichier</p>
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
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div
        className="flex cursor-pointer items-center gap-3 px-4 py-3.5 hover:bg-slate-50/60"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
          {expanded ? (
            <FolderOpen className="size-4" />
          ) : (
            <Folder className="size-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-900">{sd.nom}</p>
          <p className="text-xs text-slate-500">
            Créé le {formatDateShort(sd.dateCreation)} ·{" "}
            <span className="font-medium">
              {fichiers.length} fichier{fichiers.length !== 1 ? "s" : ""}
            </span>
          </p>
        </div>
        {sd.description && (
          <p className="hidden max-w-[180px] truncate text-xs text-slate-400 sm:block">
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
            className="size-7 text-slate-400 hover:text-primary"
            title="Renommer"
            onClick={onEdit}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-slate-400 hover:text-destructive"
            title="Supprimer"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
        {expanded ? (
          <ChevronUp className="size-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-slate-400" />
        )}
      </div>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {sd.description && (
            <p className="mb-3 text-sm text-slate-600 sm:hidden">
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
  const allSubDossiers = useStore((s) => s.subDossiers);
  const allFichiers = useStore((s) => s.fichiers);
  const addSubDossier = useStore((s) => s.addSubDossier);
  const updateSubDossier = useStore((s) => s.updateSubDossier);
  const deleteSubDossier = useStore((s) => s.deleteSubDossier);
  const addFichier = useStore((s) => s.addFichier);
  const deleteFichier = useStore((s) => s.deleteFichier);

  const [transitionOpen, setTransitionOpen] = useState(false);

  // Sub-dossier dialog states
  const [sdDialogOpen, setSdDialogOpen] = useState(false);
  const [sdEditId, setSdEditId] = useState<string | null>(null);
  const [sdNom, setSdNom] = useState("");
  const [sdDesc, setSdDesc] = useState("");

  // Sub-dossier delete confirmation
  const [sdDeleteId, setSdDeleteId] = useState<string | null>(null);

  const dossierId = dossier?.id ?? "";

  const subDossiers = useMemo(
    () => allSubDossiers.filter((sd) => sd.dossierId === dossierId),
    [allSubDossiers, dossierId],
  );

  const dossierFichiers = useMemo(
    () =>
      allFichiers.filter(
        (f) => f.dossierId === dossierId && !f.sousDossierId,
      ),
    [allFichiers, dossierId],
  );

  const subFichiersOf = (sdId: string) =>
    allFichiers.filter((f) => f.sousDossierId === sdId);

  const totalFichiers = useMemo(
    () => allFichiers.filter((f) => f.dossierId === dossierId).length,
    [allFichiers, dossierId],
  );

  if (!dossier) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <Info className="size-7" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            Dossier introuvable
          </h2>
          <p className="mt-1 text-sm text-slate-500">
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
        className="-ml-2 text-slate-500 hover:text-slate-900"
        onClick={() => go("dossiers")}
      >
        <ArrowLeft className="size-4" />
        Retour à la liste
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {dossier.reference}
          </h1>
          <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-500">
            {dossier.clientNom}
          </span>
          <DossierStatutBadge statut={dossier.statut} />
        </div>
        <div className="flex items-center gap-2">
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
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
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
            {totalFichiers > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {totalFichiers}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sous-dossiers">
            Sous-dossiers
            {subDossiers.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {subDossiers.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ---- TAB: Informations ---- */}
        <TabsContent value="informations">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* General info */}
              <Card className="border-border/80 p-5 shadow-sm">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Informations générales
                </h2>
                <InfoRow label="Client" value={dossier.clientNom} />
                <InfoRow label="Nature de la marchandise" value={dossier.nature} />
                <InfoRow
                  label="N° de BL"
                  value={<span className="font-mono text-slate-700">{dossier.bl}</span>}
                />
                <InfoRow
                  label="N° du camion"
                  value={<span className="font-mono text-slate-700">{dossier.camion}</span>}
                />
                <InfoRow
                  label="Date d'ouverture"
                  value={dossier.date ? formatDateShort(dossier.date) : "—"}
                />
              </Card>

              {/* Notes */}
              {dossier.notes && (
                <Card className="border-border/80 p-5 shadow-sm">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Notes
                  </h2>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
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
                            <p className="text-sm font-semibold text-slate-900">
                              Action suivante
                            </p>
                            <p className="mt-0.5 text-sm text-slate-600">
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
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <CheckCircle2 className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Dossier clôturé
                      </p>
                      <p className="mt-0.5 text-sm text-slate-600">
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
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
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
                      <span className="text-sm text-slate-500">Écart calculé</span>
                      <EcartValue value={ecart} />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
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

                {/* Quick stats */}
                <Card className="border-border/80 p-5 shadow-sm">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Contenu du dossier
                  </h2>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-500">
                        <Folder className="size-3.5" />
                        Sous-dossiers
                      </span>
                      <span className="font-semibold text-slate-900">{subDossiers.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-500">
                        <File className="size-3.5" />
                        Fichiers joints
                      </span>
                      <span className="font-semibold text-slate-900">{totalFichiers}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ---- TAB: Documents ---- */}
        <TabsContent value="documents">
          <Card className="border-border/80 p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Documents du dossier
                </h2>
                <p className="text-xs text-slate-500">
                  BL, factures, certificats et tout autre document lié à ce dossier
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
        </TabsContent>

        {/* ---- TAB: Sous-dossiers ---- */}
        <TabsContent value="sous-dossiers">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Sous-dossiers ({subDossiers.length})
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
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
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <FolderOpen className="size-7" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Aucun sous-dossier
                  </h3>
                  <p className="max-w-xs text-sm text-slate-500">
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
                fichiers={subFichiersOf(sd.id)}
                onEdit={() => openEditSubDossier(sd)}
                onDelete={() => setSdDeleteId(sd.id)}
                addFichier={addFichier}
                deleteFichier={deleteFichier}
              />
            ))}
          </div>
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
              <Label htmlFor="sd-nom" className="text-sm font-medium text-slate-700">
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
              <Label htmlFor="sd-desc" className="text-sm font-medium text-slate-700">
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
    </div>
  );
}

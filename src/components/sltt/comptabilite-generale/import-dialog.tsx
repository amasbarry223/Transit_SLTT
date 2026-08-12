"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  FileSpreadsheet,
  ListChecks,
  Loader2,
  UploadCloud,
} from "lucide-react";
import type { EntiteComptable } from "@/lib/domain-types";
import { parseComptabiliteGeneraleXlsx, type OperationImportRow } from "@/lib/comptabilite-generale-import";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { formatFCFA } from "@/lib/format";
import { cn, getErrorMessage } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Phase = "config" | "review" | "importing";
type CheckedState = boolean | "indeterminate";

interface ReviewRow extends OperationImportRow {
  key: string;
  selected: boolean;
  /** Ligne impossible à insérer telle quelle (date/type/tiers/nature manquant) — corrigez le fichier source et réimportez. */
  blocking: boolean;
}

function StatPill({
  icon: Icon,
  value,
  label,
  tone = "default",
}: {
  icon: typeof ListChecks;
  value: string;
  label: string;
  tone?: "default" | "primary" | "warning";
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-slate-50/60 px-3 py-2 dark:bg-slate-900/40">
      <Icon
        className={cn(
          "size-4 shrink-0",
          tone === "primary" && "text-primary",
          tone === "warning" && "text-amber-600 dark:text-amber-400",
          tone === "default" && "text-slate-400 dark:text-slate-500",
        )}
      />
      <div className="min-w-0 leading-tight">
        <p
          className={cn(
            "text-sm font-semibold tabular-nums",
            tone === "primary" && "text-primary",
            tone === "warning" && "text-amber-700 dark:text-amber-400",
            tone === "default" && "text-slate-900 dark:text-slate-100",
          )}
        >
          {value}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entite: EntiteComptable;
  /** Fichier déjà sélectionné en amont (routeur d'import auto) — déclenche l'analyse sans repasser par le sélecteur. */
  initialFile?: File | null;
}

/**
 * Import Excel du journal de caisse — jamais d'insertion silencieuse : toute
 * ligne dont la date, le type (Entrée/Sortie), le tiers ou la nature ne peut
 * être déterminé de façon fiable est marquée bloquante (case décochée et
 * désactivée) et doit être corrigée dans le fichier source avant réimport.
 */
export function ComptabiliteGeneraleImportDialog({ open, onOpenChange, entite, initialFile }: ImportDialogProps) {
  const { toast } = useToast();
  const addOperationComptable = useStore((s) => s.addOperationComptable);
  const isTopDoumani = entite.type === "societe";
  const consumedInitialFileRef = useRef<File | null>(null);

  const [phase, setPhase] = useState<Phase>("config");
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  function reset() {
    setPhase("config");
    setFileName("");
    setRows([]);
    setProgress({ done: 0, total: 0 });
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    setParsing(true);
    try {
      const buf = await file.arrayBuffer();
      const parsed = await parseComptabiliteGeneraleXlsx(buf, { entiteType: entite.type });
      if (parsed.length === 0) {
        toast({
          title: "Aucune ligne exploitable",
          description: "Vérifiez les en-têtes (Dates, Clients, Nature de la dépense, Entrée, Sortie…).",
          variant: "destructive",
        });
        return;
      }
      setRows(
        parsed.map((r, i) => {
          const blocking = !r.date || !r.type || !r.clientNom || !r.nature;
          return { ...r, key: `${r.rowNumber}-${i}`, selected: !blocking, blocking };
        }),
      );
      setPhase("review");
    } catch (e) {
      toast({ title: "Lecture impossible", description: getErrorMessage(e, "Fichier Excel invalide."), variant: "destructive" });
    } finally {
      setParsing(false);
    }
  }

  useEffect(() => {
    if (open && initialFile && consumedInitialFileRef.current !== initialFile) {
      consumedInitialFileRef.current = initialFile;
      void handleFile(initialFile);
    }
    if (!open) consumedInitialFileRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleFile est stable pour la durée du montage, seul le couple open/initialFile doit déclencher l'analyse
  }, [open, initialFile]);

  const selectedRows = useMemo(() => rows.filter((r) => r.selected), [rows]);
  const selectedCount = selectedRows.length;
  const blockingCount = useMemo(() => rows.filter((r) => r.blocking).length, [rows]);
  const softWarningCount = useMemo(
    () => selectedRows.filter((r) => !r.blocking && r.warnings.length > 0).length,
    [selectedRows],
  );
  const totalEntree = useMemo(
    () => selectedRows.filter((r) => r.type === "Entrée").reduce((s, r) => s + r.montant, 0),
    [selectedRows],
  );
  const totalSortie = useMemo(
    () => selectedRows.filter((r) => r.type === "Sortie").reduce((s, r) => s + r.montant, 0),
    [selectedRows],
  );
  const selectableRows = rows.filter((r) => !r.blocking);
  const allChecked: CheckedState =
    selectableRows.length === 0
      ? false
      : selectableRows.every((r) => r.selected)
        ? true
        : selectableRows.some((r) => r.selected)
          ? "indeterminate"
          : false;

  function toggleRow(key: string, value: boolean) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, selected: value } : r)));
  }
  function toggleAll(value: boolean) {
    setRows((prev) => prev.map((r) => (r.blocking ? r : { ...r, selected: value })));
  }

  async function handleConfirm() {
    const toImport = rows.filter((r) => r.selected && !r.blocking && r.date && r.type);
    if (toImport.length === 0) return;

    setPhase("importing");
    setProgress({ done: 0, total: toImport.length });

    let created = 0;
    let failed = 0;

    for (const row of toImport) {
      try {
        await addOperationComptable({
          entiteType: entite.type,
          annexeId: entite.type === "annexe" ? entite.id : undefined,
          societeId: entite.type === "societe" ? entite.id : undefined,
          date: row.date!,
          clientNom: row.clientNom,
          nature: row.nature,
          type: row.type!,
          montant: row.montant,
          quantite: row.quantite ?? undefined,
          prixUnitaire: row.prixUnitaire ?? undefined,
          source: "import_excel",
          importRef: fileName,
        });
        created++;
      } catch {
        failed++;
      } finally {
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
    }

    toast({
      title: failed === 0 ? "Import terminé" : "Import terminé avec erreurs",
      description: `${created} opération${created !== 1 ? "s" : ""} créée${created !== 1 ? "s" : ""}${failed > 0 ? ` — ${failed} échec${failed !== 1 ? "s" : ""}` : ""}.`,
      variant: failed > 0 ? "destructive" : undefined,
    });

    onOpenChange(false);
    reset();
  }

  const importPct = progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (phase === "importing") return;
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className={cn("flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0", phase === "config" ? "sm:max-w-lg" : "sm:max-w-4xl")}>
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-primary" />
            Import Excel — {entite.label}
          </DialogTitle>
          <DialogDescription>
            {phase === "config"
              ? "Importez le classeur Excel (Dates, Clients, Nature de la dépense, Entrée, Sortie" + (isTopDoumani ? ", Quantité, Prix unitaire" : "") + ")."
              : "Vérifiez chaque ligne avant import. Les lignes en rouge sont bloquantes (données manquantes) et doivent être corrigées dans le fichier source."}
          </DialogDescription>
        </DialogHeader>

        {phase === "config" && (
          <div className="space-y-4 overflow-y-auto p-6">
            <div className="rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-700">
              <input
                type="file"
                id="cg-import-file"
                className="hidden"
                accept=".xlsx"
                disabled={parsing}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                  e.target.value = "";
                }}
              />
              {parsing ? <Loader2 className="mx-auto mb-2 size-8 animate-spin text-primary" /> : <UploadCloud className="mx-auto mb-2 size-8 text-primary" />}
              <label htmlFor="cg-import-file" className={cn("inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary hover:underline", parsing && "pointer-events-none opacity-60")}>
                {parsing ? "Analyse du fichier…" : "Sélectionner le fichier .xlsx"}
              </label>
              {fileName && !parsing && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{fileName}</p>}
            </div>
          </div>
        )}

        {(phase === "review" || phase === "importing") && (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
            <div className="flex flex-wrap gap-2">
              <StatPill icon={ListChecks} value={String(rows.length)} label="lignes détectées" />
              <StatPill icon={CheckCircle2} value={String(selectedCount)} label="sélectionnées" tone="primary" />
              <StatPill icon={ArrowDownCircle} value={formatFCFA(totalEntree)} label="entrées (sélection)" />
              <StatPill icon={ArrowUpCircle} value={formatFCFA(totalSortie)} label="sorties (sélection)" />
              {blockingCount > 0 && <StatPill icon={AlertTriangle} value={String(blockingCount)} label="ligne(s) bloquante(s)" tone="warning" />}
              {softWarningCount > 0 && <StatPill icon={AlertTriangle} value={String(softWarningCount)} label="ligne(s) avec alerte" tone="warning" />}
            </div>

            <TooltipProvider delayDuration={150}>
              <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background">
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox checked={allChecked} disabled={phase === "importing"} onCheckedChange={(v) => toggleAll(v === true)} aria-label="Sélectionner toutes les lignes" />
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Client / Tiers</TableHead>
                      <TableHead>Nature</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.key} className={cn(r.blocking && "bg-red-50/60 dark:bg-red-950/20", !r.blocking && !r.selected && "opacity-45")}>
                        <TableCell>
                          <Checkbox checked={r.selected} disabled={phase === "importing" || r.blocking} onCheckedChange={(v) => toggleRow(r.key, v === true)} aria-label={`Inclure la ligne ${r.rowNumber}`} />
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.date || <span className="font-medium text-red-600 dark:text-red-400">{r.dateRaw || "—"}</span>}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate text-xs" title={r.clientNom}>
                          {r.clientNom || <span className="italic text-red-600 dark:text-red-400">manquant</span>}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs" title={r.nature}>
                          {r.nature || <span className="italic text-red-600 dark:text-red-400">manquante</span>}
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.type ? (
                            <Badge variant="outline" className={cn("text-xs font-normal", r.type === "Entrée" ? "border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-400" : "border-amber-200 text-amber-700 dark:border-amber-900 dark:text-amber-400")}>
                              {r.type}
                            </Badge>
                          ) : (
                            <span className="italic text-red-600 dark:text-red-400">indéterminé</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">{formatFCFA(r.montant)}</TableCell>
                        <TableCell>
                          {r.warnings.length > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button type="button" className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400" aria-label={`${r.warnings.length} alerte(s)`}>
                                  <AlertTriangle className="size-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs text-xs">
                                <ul className="list-disc space-y-0.5 pl-3">
                                  {r.warnings.map((w) => <li key={w}>{w}</li>)}
                                </ul>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TooltipProvider>

            {blockingCount > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p>{blockingCount} ligne{blockingCount !== 1 ? "s" : ""} ne peu{blockingCount !== 1 ? "vent" : "t"} pas être importée{blockingCount !== 1 ? "s" : ""} en l&apos;état — corrigez le fichier source (date, tiers, nature ou montant manquant) et réimportez.</p>
              </div>
            )}

            {phase === "importing" && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Loader2 className="size-4 animate-spin" />
                  Import en cours… {progress.done}/{progress.total}
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out" style={{ width: `${importPct}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
          {phase === "review" && (
            <Button variant="outline" onClick={() => setPhase("config")}>Retour</Button>
          )}
          <Button variant="outline" onClick={() => { onOpenChange(false); reset(); }} disabled={phase === "importing"}>Annuler</Button>
          {phase === "review" && (
            <Button onClick={() => void handleConfirm()} disabled={selectedCount === 0}>
              <CheckCircle2 className="size-4" />
              Importer {selectedCount} opération{selectedCount !== 1 ? "s" : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

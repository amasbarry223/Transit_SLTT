"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  ListChecks,
  Loader2,
  UploadCloud,
} from "lucide-react";
import type { ClasseurEntry } from "@/lib/classeur";
import type { Client } from "@/lib/domain-types";
import {
  parseClasseurXlsx,
  planClasseurImport,
  type ClasseurImportApplyPlan,
  type ClasseurImportRow,
} from "@/lib/classeur-import";
import { DEFAULT_PAIEMENT_MODE } from "@/lib/constants";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { formatFCFA } from "@/lib/format";
import { cn, getErrorMessage } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Phase = "pick" | "review" | "importing";

type ReviewRow =
  | {
      key: string;
      kind: "update";
      sourceType: ClasseurImportApplyPlan["updates"][number]["sourceType"];
      reference: string;
      libelle: string;
      debit: number;
      credit: number;
    }
  | {
      key: string;
      kind: "create";
      row: ClasseurImportRow;
    };

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
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs",
        tone === "primary" && "border-primary/30 bg-primary/5 text-primary",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300",
        tone === "default" && "border-border bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300",
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="font-semibold tabular-nums">{value}</span>
      <span>{label}</span>
    </div>
  );
}

export function ClasseurImportDialog({
  open,
  onOpenChange,
  client,
  journalEntries,
  canWriteDossiers,
  canWriteCompta,
  canWriteFactures,
  onApplied,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  journalEntries: ClasseurEntry[];
  canWriteDossiers: boolean;
  canWriteCompta: boolean;
  canWriteFactures: boolean;
  onApplied: () => void;
}) {
  const { toast } = useToast();
  const patchDossierClasseur = useStore((s) => s.patchDossierClasseur);
  const patchEcriture = useStore((s) => s.patchEcriture);
  const patchFactureMontantPaye = useStore((s) => s.patchFactureMontantPaye);
  const addEcriture = useStore((s) => s.addEcriture);

  const [phase, setPhase] = useState<Phase>("pick");
  const [parsing, setParsing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [plan, setPlan] = useState<ClasseurImportApplyPlan | null>(null);
  const [importedRows, setImportedRows] = useState<ClasseurImportRow[]>([]);

  const refBySourceId = useMemo(
    () => new Map(journalEntries.map((e) => [e.sourceId, e.reference])),
    [journalEntries],
  );

  const reviewRows = useMemo((): ReviewRow[] => {
    if (!plan) return [];
    const updates: ReviewRow[] = plan.updates
      .filter((u) => {
        if (u.sourceType === "Dossier") return canWriteDossiers;
        if (u.sourceType === "Paiement") return canWriteCompta;
        if (u.sourceType === "Facture") return canWriteFactures;
        return false;
      })
      .map((u, i) => ({
        key: `update-${u.sourceType}-${u.sourceId}-${i}`,
        kind: "update" as const,
        sourceType: u.sourceType,
        reference: refBySourceId.get(u.sourceId) ?? u.sourceId,
        libelle: u.libelle ?? "",
        debit: u.debit ?? 0,
        credit: u.credit ?? 0,
      }));

    const creates: ReviewRow[] = canWriteCompta
      ? plan.unmatched
          .filter((row) => (row.type === "Paiement" || row.type === "all") && (row.debit !== 0 || row.credit !== 0))
          .map((row, i) => ({
            key: `create-${row.rowNumber}-${i}`,
            kind: "create" as const,
            row,
          }))
      : [];

    return [...updates, ...creates];
  }, [plan, canWriteCompta, canWriteDossiers, canWriteFactures, refBySourceId]);

  const unmatchedSkipped = useMemo(() => {
    if (!plan) return 0;
    const creatable = plan.unmatched.filter(
      (row) => (row.type === "Paiement" || row.type === "all") && (row.debit !== 0 || row.credit !== 0),
    ).length;
    return plan.unmatched.length - (canWriteCompta ? creatable : 0);
  }, [plan, canWriteCompta]);

  function reset() {
    setPhase("pick");
    setParsing(false);
    setFileName("");
    setPlan(null);
    setImportedRows([]);
  }

  async function handleFile(file: File) {
    if (!client) return;
    setParsing(true);
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const imported = await parseClasseurXlsx(buf);
      const nextPlan = planClasseurImport(imported, journalEntries);
      setImportedRows(imported);
      setPlan(nextPlan);
      setPhase("review");
    } catch (e) {
      toast({
        title: "Import impossible",
        description: getErrorMessage(e, "Fichier Excel invalide"),
        variant: "destructive",
      });
    } finally {
      setParsing(false);
    }
  }

  async function handleConfirm() {
    if (!client || !plan) return;
    setPhase("importing");
    try {
      let applied = 0;
      for (const u of plan.updates) {
        if (u.sourceType === "Dossier" && canWriteDossiers) {
          await patchDossierClasseur(u.sourceId, {
            montantInvesti: u.debit,
            montantPaye: u.credit,
          });
          applied++;
        } else if (u.sourceType === "Paiement" && canWriteCompta) {
          await patchEcriture(u.sourceId, {
            montantInvesti: u.debit,
            montantPaye: u.credit,
            note: u.libelle,
          });
          applied++;
        } else if (u.sourceType === "Facture" && canWriteFactures && u.credit != null) {
          await patchFactureMontantPaye(u.sourceId, u.credit);
          applied++;
        }
      }

      if (canWriteCompta) {
        for (const row of plan.unmatched) {
          if (row.type !== "Paiement" && row.type !== "all") continue;
          if (row.debit === 0 && row.credit === 0) continue;
          await addEcriture({
            date: row.date,
            clientId: client.id,
            clientNom: client.nom,
            annexeId: client.annexeId,
            montantInvesti: row.debit,
            montantPaye: row.credit,
            modePaiement: DEFAULT_PAIEMENT_MODE,
            note: row.libelle || `Import Excel · ${row.reference}`,
          });
          applied++;
        }
      }

      onApplied();
      toast({
        title: "Import Excel terminé",
        description: `${applied} ligne(s) appliquée(s)${plan.unmatched.length ? ` · ${plan.unmatched.length} non appariée(s)` : ""}.`,
      });
      onOpenChange(false);
      reset();
    } catch (e) {
      toast({
        title: "Import impossible",
        description: getErrorMessage(e, "Erreur"),
        variant: "destructive",
      });
      setPhase("review");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (phase === "importing") return;
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-primary" />
            Importer le classeur Excel
          </DialogTitle>
          <DialogDescription>
            {client
              ? `Réconciliez les lignes du fichier avec le journal de ${client.nom} avant application.`
              : "Sélectionnez un client pour importer."}
          </DialogDescription>
        </DialogHeader>

        {phase === "pick" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <div className="w-full max-w-md rounded-xl border-2 border-dashed border-border bg-slate-50/60 p-8 text-center dark:bg-slate-900/40">
              <input
                id="classeur-import-file"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="sr-only"
                disabled={parsing || !client}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                  e.target.value = "";
                }}
              />
              {parsing ? (
                <Loader2 className="mx-auto mb-2 size-8 animate-spin text-primary" />
              ) : (
                <UploadCloud className="mx-auto mb-2 size-8 text-primary" />
              )}
              <label
                htmlFor="classeur-import-file"
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary hover:underline",
                  (parsing || !client) && "pointer-events-none opacity-60",
                )}
              >
                {parsing ? "Analyse du fichier…" : "Sélectionner le fichier .xlsx"}
              </label>
              {fileName && !parsing && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{fileName}</p>}
            </div>
          </div>
        )}

        {(phase === "review" || phase === "importing") && plan && (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
            <div className="flex flex-wrap gap-2">
              <StatPill icon={ListChecks} value={String(importedRows.length)} label="lignes lues" />
              <StatPill icon={CheckCircle2} value={String(reviewRows.length)} label="à appliquer" tone="primary" />
              {unmatchedSkipped > 0 && (
                <StatPill icon={AlertTriangle} value={String(unmatchedSkipped)} label="non appariée(s)" tone="warning" />
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-right">Débit</TableHead>
                    <TableHead className="text-right">Crédit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        Aucune ligne applicable avec vos permissions actuelles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reviewRows.map((r) => (
                      <TableRow key={r.key}>
                        <TableCell>
                          {r.kind === "update" ? (
                            <Badge variant="outline" className="text-xs font-normal">
                              Màj {r.sourceType}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-emerald-200 text-xs font-normal text-emerald-700 dark:border-emerald-900 dark:text-emerald-400">
                              Créer écriture
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{r.kind === "update" ? r.reference : r.row.reference}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs" title={r.kind === "update" ? r.libelle : r.row.libelle}>
                          {r.kind === "update" ? r.libelle || "—" : r.row.libelle || "—"}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {formatFCFA(r.kind === "update" ? r.debit : r.row.debit)}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {formatFCFA(r.kind === "update" ? r.credit : r.row.credit)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {unmatchedSkipped > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p>
                  {unmatchedSkipped} ligne{unmatchedSkipped !== 1 ? "s" : ""} du fichier n&apos;ont pas pu être
                  appariées et ne seront pas importées automatiquement.
                </p>
              </div>
            )}

            {phase === "importing" && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Loader2 className="size-4 animate-spin" />
                Import en cours…
              </div>
            )}
          </div>
        )}

        <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
          {phase === "review" && (
            <Button variant="outline" onClick={() => setPhase("pick")}>
              Retour
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              reset();
            }}
            disabled={phase === "importing"}
          >
            Annuler
          </Button>
          {phase === "review" && (
            <Button onClick={() => void handleConfirm()} disabled={reviewRows.length === 0}>
              <CheckCircle2 className="size-4" />
              Importer {reviewRows.length} ligne{reviewRows.length !== 1 ? "s" : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

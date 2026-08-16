"use client";

import { Fragment, useMemo, useState } from "react";
import {
  FileSpreadsheet,
  Loader2,
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  Users,
  ListChecks,
  Wallet,
  Banknote,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { usePermission } from "@/hooks/use-permission";
import { useActiveAnnexe } from "@/hooks/use-active-annexe";
import { resolveTransitSociete } from "@/lib/societe-brand";
import {
  parseDossierBulkXlsx,
  looksLikeJournalCaisseWorkbook,
  type DossierBulkImportRow,
} from "@/lib/dossier-bulk-import";
import { formatFCFA } from "@/lib/format";
import { getErrorMessage, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ToneBadge } from "@/components/sltt/status-badge";

type Phase = "config" | "review" | "importing";
type StatutHistorique = "En cours" | "Soldé";
type CheckedState = boolean | "indeterminate";

interface ReviewRow extends DossierBulkImportRow {
  key: string;
  selected: boolean;
  statutCalcule: StatutHistorique;
  reste: number;
}

/** Petite statistique inline (icône + valeur + libellé) — plus légère qu'une KpiCard, pour l'en-tête d'un dialog. */
function StatPill({
  icon: Icon,
  value,
  label,
  tone = "default",
}: {
  icon: typeof Users;
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

/**
 * Import en masse de dossiers historiques depuis un classeur Excel « Situation
 * des clients » (une feuille par client). Crée les clients manquants, puis les
 * dossiers via importDossierHistorique (montant payé/statut fixés directement —
 * ce sont des opérations déjà closes, pas un flux à faire progresser).
 */
export function DossierBulkImportButton() {
  const { toast } = useToast();
  const canWriteDossiers = usePermission("dossiers:write");
  const canWriteClients = usePermission("clients:write");
  const canUse = canWriteDossiers && canWriteClients;
  const societes = useStore((s) => s.societes);
  const clients = useStore((s) => s.clients);
  const addClient = useStore((s) => s.addClient);
  const importDossierHistorique = useStore((s) => s.importDossierHistorique);
  const { annexes, activeAnnexeId } = useActiveAnnexe();

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("config");
  const [societeId, setSocieteId] = useState("");
  const [defaultAnnexeId, setDefaultAnnexeId] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [groupAnnexeId, setGroupAnnexeId] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  function reset() {
    setPhase("config");
    setFileName("");
    setRows([]);
    setGroupAnnexeId({});
    setProgress({ done: 0, total: 0 });
  }

  function openDialog() {
    setSocieteId((prev) => prev || resolveTransitSociete(societes)?.id || societes[0]?.id || "");
    setDefaultAnnexeId((prev) => prev || activeAnnexeId || "");
    reset();
    setOpen(true);
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    setParsing(true);
    try {
      const buf = await file.arrayBuffer();
      const parsed = await parseDossierBulkXlsx(buf);
      if (parsed.length === 0) {
        const isJournalCaisse = await looksLikeJournalCaisseWorkbook(buf);
        toastWarning(toast, {
          title: "Aucune ligne exploitable",
          description: isJournalCaisse
            ? "Ce fichier ressemble à un journal de caisse (colonnes Entrée/Sortie) — importez-le plutôt depuis Comptabilité → Journal de caisse → « Importer un document »."
            : "Vérifiez que le fichier contient des feuilles « Situation du Client X » avec un tableau Date/Nature/Total investi.",
        });
        return;
      }
      setRows(
        parsed.map((r, i) => {
          const reste = r.montantInvesti - r.montantPaye;
          return {
            ...r,
            key: `${r.sheetName}-${r.rowNumber}-${i}`,
            selected: r.montantInvesti > 0,
            statutCalcule: reste <= 0 ? "Soldé" : "En cours",
            reste,
          };
        }),
      );
      // Un même classeur peut mélanger des clients des deux annexes (ex. Mali et Côte
      // d'Ivoire) — chaque groupe client démarre sur l'annexe par défaut du formulaire
      // mais reste modifiable individuellement dans la revue ci-dessous.
      setGroupAnnexeId(
        Object.fromEntries(
          Array.from(new Set(parsed.map((r) => r.clientNom.trim().toLowerCase()))).map((key) => [
            key,
            defaultAnnexeId,
          ]),
        ),
      );
      setPhase("review");
    } catch (e) {
      toastError(toast, e, { title: "Lecture impossible", fallback: "Fichier Excel invalide." });
    } finally {
      setParsing(false);
    }
  }

  const groups = useMemo(() => {
    const map = new Map<string, ReviewRow[]>();
    for (const r of rows) {
      const key = r.clientNom.trim().toLowerCase();
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    return Array.from(map.entries()).map(([key, groupRows]) => {
      const selectedInGroup = groupRows.filter((r) => r.selected);
      // Un client déjà existant a déjà une annexe fixée en base — un dossier doit toujours
      // rester dans l'annexe de son client (cf. cloisonnement multi-annexes), donc pas de choix
      // libre ici. Seuls les nouveaux clients peuvent être assignés à l'une ou l'autre annexe.
      const existingClient = clients.find((c) => c.nom.trim().toLowerCase() === key);
      return {
        key,
        nom: groupRows[0].clientNom,
        existing: Boolean(existingClient),
        lockedAnnexeId: existingClient?.annexeId,
        rows: groupRows,
        totalInvesti: selectedInGroup.reduce((sum, r) => sum + r.montantInvesti, 0),
        totalPaye: selectedInGroup.reduce((sum, r) => sum + r.montantPaye, 0),
        checkedState: (groupRows.every((r) => r.selected)
          ? true
          : groupRows.some((r) => r.selected)
            ? "indeterminate"
            : false) as CheckedState,
      };
    });
  }, [rows, clients]);

  const selectedRows = useMemo(() => rows.filter((r) => r.selected), [rows]);
  const selectedCount = selectedRows.length;
  const alertCount = selectedRows.filter((r) => r.warnings.length > 0).length;
  const totalInvesti = useMemo(
    () => selectedRows.reduce((sum, r) => sum + r.montantInvesti, 0),
    [selectedRows],
  );
  const totalPaye = useMemo(
    () => selectedRows.reduce((sum, r) => sum + r.montantPaye, 0),
    [selectedRows],
  );
  const allChecked: CheckedState = rows.length === 0 ? false : rows.every((r) => r.selected)
    ? true
    : rows.some((r) => r.selected)
      ? "indeterminate"
      : false;

  function toggleRow(key: string, value: boolean) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, selected: value } : r)));
  }

  function toggleGroup(groupKey: string, value: boolean) {
    setRows((prev) =>
      prev.map((r) => (r.clientNom.trim().toLowerCase() === groupKey ? { ...r, selected: value } : r)),
    );
  }

  function toggleAll(value: boolean) {
    setRows((prev) => prev.map((r) => ({ ...r, selected: value })));
  }

  async function handleConfirm() {
    if (!societeId) return;
    const toImport = rows.filter((r) => r.selected);
    if (toImport.length === 0) return;

    const annexeIdByGroupKey = new Map(groups.map((g) => [g.key, g.lockedAnnexeId ?? groupAnnexeId[g.key]]));
    if (toImport.some((r) => !annexeIdByGroupKey.get(r.clientNom.trim().toLowerCase()))) return;

    setPhase("importing");
    setProgress({ done: 0, total: toImport.length });

    const clientIdByKey = new Map<string, string>();
    for (const c of clients) clientIdByKey.set(c.nom.trim().toLowerCase(), c.id);

    let created = 0;
    let failed = 0;
    const today = new Date().toISOString().slice(0, 10);

    for (const row of toImport) {
      try {
        const key = row.clientNom.trim().toLowerCase();
        const rowAnnexeId = annexeIdByGroupKey.get(key)!;
        let clientId = clientIdByKey.get(key);
        if (!clientId) {
          const newClient = await addClient({
            nom: row.clientNom.trim(),
            type: "Entreprise",
            telephone: "",
            email: "",
            adresse: "",
            annexeId: rowAnnexeId,
            societeId,
          });
          clientId = newClient.id;
          clientIdByKey.set(key, clientId);
        }

        const noteParts = [
          "Import historique (Excel)",
          row.quantite ? `Qté ${row.quantite}` : null,
          row.factureNo ? `Facture ${row.factureNo}` : null,
          `feuille « ${row.sheetName} », ligne ${row.rowNumber}`,
        ].filter((p): p is string => Boolean(p));

        await importDossierHistorique({
          societeId,
          annexeId: rowAnnexeId,
          clientId,
          clientNom: row.clientNom.trim(),
          nature: row.nature || "Marchandise (import historique)",
          date: row.date || today,
          montantInvesti: row.montantInvesti,
          montantPaye: row.montantPaye,
          statut: row.statutCalcule,
          notes: noteParts.join(" — "),
        });
        created++;
      } catch {
        failed++;
      } finally {
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
    }

    const importDescription = `${created} dossier${created !== 1 ? "s" : ""} créé${created !== 1 ? "s" : ""}${
        failed > 0 ? ` — ${failed} échec${failed !== 1 ? "s" : ""}` : ""
      }.`;
    if (failed === 0) {
      toastSuccess(toast, { title: "Import terminé", description: importDescription });
    } else {
      toastWarning(toast, { title: "Import terminé avec erreurs", description: importDescription });
    }

    setOpen(false);
    reset();
  }

  if (!canUse) return null;

  const importPct = progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100);

  return (
    <>
      <Button type="button" variant="outline" onClick={openDialog}>
        <FileSpreadsheet className="size-4" />
        Import historique
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (phase === "importing") return;
          setOpen(v);
          if (!v) reset();
        }}
      >
        <DialogContent
          className={cn(
            "flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0",
            phase === "config" ? "sm:max-w-lg" : "sm:max-w-4xl",
          )}
        >
          <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="size-5 text-primary" />
              Import de dossiers historiques
            </DialogTitle>
            <DialogDescription>
              {phase === "config"
                ? "Importez un classeur Excel « Situation des clients » (une feuille par client) pour créer en une fois les clients et dossiers manquants, avec leur solde déjà connu."
                : "Vérifiez les lignes détectées avant de les importer. Décochez celles à exclure."}
            </DialogDescription>
          </DialogHeader>

          {phase === "config" && (
            <div className="space-y-4 overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    Société <span className="text-red-500">*</span>
                  </Label>
                  <Select value={societeId || undefined} onValueChange={setSocieteId}>
                    <SelectTrigger aria-label="Sélectionner une société">
                      <SelectValue placeholder="Sélectionner une société" />
                    </SelectTrigger>
                    <SelectContent>
                      {societes
                        .filter((s) => s.actif || s.id === societeId)
                        .map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.nom}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Annexe par défaut <span className="text-red-500">*</span>
                  </Label>
                  <Select value={defaultAnnexeId || undefined} onValueChange={setDefaultAnnexeId}>
                    <SelectTrigger aria-label="Sélectionner une annexe par défaut">
                      <SelectValue placeholder="Sélectionner une annexe" />
                    </SelectTrigger>
                    <SelectContent>
                      {annexes.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Société appliquée à tous les dossiers de ce fichier. L&apos;annexe, elle, se choisit
                ensuite client par client à l&apos;étape suivante — utile si le classeur mélange des
                clients de plusieurs annexes.
              </p>

              <div className="rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-700">
                <input
                  type="file"
                  id="dossier-bulk-import-file"
                  className="hidden"
                  accept=".xlsx"
                  disabled={!societeId || !defaultAnnexeId || parsing}
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
                  htmlFor="dossier-bulk-import-file"
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary hover:underline",
                    (!societeId || !defaultAnnexeId || parsing) && "pointer-events-none opacity-60",
                  )}
                >
                  {parsing ? "Analyse du fichier…" : "Sélectionner le fichier .xlsx"}
                </label>
                {fileName && !parsing && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{fileName}</p>
                )}
              </div>
            </div>
          )}

          {(phase === "review" || phase === "importing") && (
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
              <div className="flex flex-wrap gap-2">
                <StatPill icon={Users} value={String(groups.length)} label="clients" />
                <StatPill icon={ListChecks} value={String(rows.length)} label="lignes détectées" />
                <StatPill
                  icon={CheckCircle2}
                  value={String(selectedCount)}
                  label="sélectionnées"
                  tone="primary"
                />
                <StatPill icon={Wallet} value={formatFCFA(totalInvesti)} label="investi (sélection)" />
                <StatPill icon={Banknote} value={formatFCFA(totalPaye)} label="payé (sélection)" />
                {alertCount > 0 && (
                  <StatPill
                    icon={AlertTriangle}
                    value={String(alertCount)}
                    label="ligne(s) avec alerte"
                    tone="warning"
                  />
                )}
              </div>

              <TooltipProvider delayDuration={150}>
                <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background">
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={allChecked}
                            disabled={phase === "importing"}
                            onCheckedChange={(v) => toggleAll(v === true)}
                            aria-label="Sélectionner toutes les lignes"
                          />
                        </TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Nature</TableHead>
                        <TableHead className="text-right">Investi</TableHead>
                        <TableHead className="text-right">Payé</TableHead>
                        <TableHead className="text-right">Reste</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groups.map((g) => (
                        <Fragment key={g.key}>
                          <TableRow className="border-b border-border bg-slate-50 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800/60">
                            <TableCell className="py-1.5">
                              <Checkbox
                                checked={g.checkedState}
                                disabled={phase === "importing"}
                                onCheckedChange={(v) => toggleGroup(g.key, v === true)}
                                aria-label={`Sélectionner toutes les lignes de ${g.nom}`}
                              />
                            </TableCell>
                            <TableCell colSpan={7} className="py-1.5">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                  {g.nom}
                                </span>
                                <ToneBadge tone={g.existing ? "slate" : "blue"} size="sm">
                                  {g.existing ? "Client existant" : "Nouveau client"}
                                </ToneBadge>
                                {g.lockedAnnexeId ? (
                                  <ToneBadge tone="slate" size="sm">
                                    Annexe {annexes.find((a) => a.id === g.lockedAnnexeId)?.nom ?? "—"}
                                  </ToneBadge>
                                ) : annexes.length > 1 ? (
                                  <Select
                                    value={groupAnnexeId[g.key] || defaultAnnexeId}
                                    onValueChange={(v) => setGroupAnnexeId((prev) => ({ ...prev, [g.key]: v }))}
                                  >
                                    <SelectTrigger
                                      className="h-6 w-auto gap-1 border-none bg-transparent px-1.5 text-[11px] font-medium text-primary shadow-none hover:bg-primary/10"
                                      aria-label={`Annexe pour ${g.nom}`}
                                    >
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {annexes.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                          Annexe {a.nom}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : null}
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                  {g.rows.length} ligne{g.rows.length !== 1 ? "s" : ""} · Investi{" "}
                                  {formatFCFA(g.totalInvesti)} · Payé {formatFCFA(g.totalPaye)}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                          {g.rows.map((r) => (
                            <TableRow
                              key={r.key}
                              className={cn(!r.selected && "opacity-45")}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={r.selected}
                                  disabled={phase === "importing"}
                                  onCheckedChange={(v) => toggleRow(r.key, v === true)}
                                  aria-label={`Inclure la ligne ${r.rowNumber} de ${r.sheetName}`}
                                />
                              </TableCell>
                              <TableCell className="text-xs">
                                {r.date || <span className="text-red-500">{r.dateRaw || "—"}</span>}
                              </TableCell>
                              <TableCell className="max-w-[180px] truncate text-xs" title={r.nature}>
                                {r.nature || (
                                  <span className="italic text-slate-400 dark:text-slate-500">
                                    {r.isPaiementSeul ? "Versement / règlement" : "—"}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right text-xs tabular-nums">
                                {formatFCFA(r.montantInvesti)}
                              </TableCell>
                              <TableCell className="text-right text-xs tabular-nums">
                                {formatFCFA(r.montantPaye)}
                              </TableCell>
                              <TableCell className="text-right text-xs tabular-nums">
                                {r.reste > 0 ? (
                                  <span className="font-medium text-amber-600 dark:text-amber-400">
                                    {formatFCFA(r.reste)}
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 dark:text-emerald-400">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <ToneBadge
                                  tone={r.statutCalcule === "Soldé" ? "emerald" : "amber"}
                                  size="sm"
                                >
                                  {r.statutCalcule}
                                </ToneBadge>
                              </TableCell>
                              <TableCell>
                                {r.warnings.length > 0 && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400"
                                        aria-label={`${r.warnings.length} alerte(s)`}
                                      >
                                        <AlertTriangle className="size-3.5" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-xs text-xs">
                                      <ul className="list-disc space-y-0.5 pl-3">
                                        {r.warnings.map((w) => (
                                          <li key={w}>{w}</li>
                                        ))}
                                      </ul>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TooltipProvider>

              {alertCount > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <p>
                    {alertCount} ligne{alertCount !== 1 ? "s" : ""} sélectionnée{alertCount !== 1 ? "s" : ""}{" "}
                    présente{alertCount !== 1 ? "nt" : ""} une alerte — survolez l&apos;icône pour le détail.
                  </p>
                </div>
              )}

              {phase === "importing" && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Loader2 className="size-4 animate-spin" />
                    Import en cours… {progress.done}/{progress.total}
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
                      style={{ width: `${importPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
            {phase === "review" && (
              <Button variant="outline" onClick={() => setPhase("config")}>
                Retour
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                reset();
              }}
              disabled={phase === "importing"}
            >
              Annuler
            </Button>
            {phase === "review" && (
              <Button onClick={() => void handleConfirm()} disabled={selectedCount === 0}>
                <CheckCircle2 className="size-4" />
                Importer {selectedCount} dossier{selectedCount !== 1 ? "s" : ""}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

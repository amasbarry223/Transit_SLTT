"use client";

import { Fragment, useMemo, useState } from "react";
import {
  FileSpreadsheet,
  Loader2,
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  ListChecks,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast-helpers";
import { usePermission } from "@/hooks/use-permission";
import { useActiveAnnexe } from "@/hooks/use-active-annexe";
import { shouldShowAnnexeForSociete } from "@/lib/societe-brand";
import { parseStockBulkXlsx, type StockBulkImportRow } from "@/lib/stock-bulk-import";
import { getErrorMessage, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
type CheckedState = boolean | "indeterminate";

interface ReviewRow extends StockBulkImportRow {
  key: string;
  selected: boolean;
  /** Date éditable (ISO) — pré-remplie depuis le parsing, corrigeable en revue. */
  dateValue: string;
}

interface ReviewGroup {
  key: string;
  sheetName: string;
  marchandise: string;
  unite: string;
  seuil: string;
  rows: ReviewRow[];
}

/** Petite statistique inline (icône + valeur + libellé) — plus légère qu'une KpiCard, pour l'en-tête d'un dialog. */
function StatPill({
  icon: Icon,
  value,
  label,
  tone = "default",
}: {
  icon: typeof Boxes;
  value: string;
  label: string;
  tone?: "default" | "primary" | "warning";
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 bg-muted/40">
      <Icon
        className={cn(
          "size-4 shrink-0",
          tone === "primary" && "text-primary",
          tone === "warning" && "text-amber-600 dark:text-amber-400",
          tone === "default" && "text-muted-foreground",
        )}
      />
      <div className="min-w-0 leading-tight">
        <p
          className={cn(
            "text-sm font-semibold tabular-nums",
            tone === "primary" && "text-primary",
            tone === "warning" && "text-amber-700 dark:text-amber-400",
            tone === "default" && "text-foreground",
          )}
        >
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/**
 * Import en masse d'un historique de mouvements de stock depuis un classeur Excel
 * « grand livre » (une feuille par article : Dates | Désignation | Quantité |
 * Entrée | Sortie | Stocks). Crée l'article (quantite=0) puis rejoue chaque
 * mouvement daté via importStockHistorique — réservé aux articles qui
 * n'existent pas encore (le store refuse sinon, pour ne jamais dupliquer ou
 * écraser un historique existant).
 */
export function StockBulkImportButton() {
  const { toast } = useToast();
  const canWrite = usePermission("stock:write");
  const societes = useStore((s) => s.societes);
  const clients = useStore((s) => s.clients);
  const importStockHistorique = useStore((s) => s.importStockHistorique);
  const { annexes, activeAnnexeId } = useActiveAnnexe();

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("config");
  const [societeId, setSocieteId] = useState("");
  const [annexeId, setAnnexeId] = useState("");
  const [clientId, setClientId] = useState("");
  const [depositaire, setDepositaire] = useState("");
  const [commercial, setCommercial] = useState("");
  const [defaultMarchandise, setDefaultMarchandise] = useState("");
  const [defaultUnite, setDefaultUnite] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [groups, setGroups] = useState<ReviewGroup[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const showAnnexe = shouldShowAnnexeForSociete(societeId, societes, annexes);
  const effectiveAnnexeId = showAnnexe ? annexeId : (activeAnnexeId ?? "");

  function reset() {
    setPhase("config");
    setFileName("");
    setGroups([]);
    setProgress({ done: 0, total: 0 });
  }

  function openDialog() {
    setSocieteId((prev) => prev || societes[0]?.id || "");
    setAnnexeId((prev) => prev || activeAnnexeId || "");
    setClientId("");
    setDepositaire("");
    setCommercial("");
    setDefaultMarchandise("");
    setDefaultUnite("");
    reset();
    setOpen(true);
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    setParsing(true);
    try {
      const buf = await file.arrayBuffer();
      const parsed = await parseStockBulkXlsx(buf);
      if (parsed.length === 0) {
        toastWarning(toast, {
          title: "Aucune ligne exploitable",
          description:
            "Vérifiez que le fichier contient un tableau avec les colonnes Dates, Désignation, Entrée, Sortie (et idéalement Stocks pour le contrôle croisé).",
        });
        return;
      }
      setGroups(
        parsed.map((g, gi) => ({
          key: `${g.sheetName}-${gi}`,
          sheetName: g.sheetName,
          // Un classeur à une seule feuille (cas courant) est déjà prêt à
          // importer sans rien retaper ici, grâce au nom/unité par défaut
          // saisis à l'étape précédente. Un classeur multi-articles reste
          // éditable feuille par feuille ci-dessous si les noms diffèrent.
          marchandise: g.articleNomSuggere || defaultMarchandise,
          unite: defaultUnite,
          seuil: "10",
          rows: g.rows.map((r, ri) => {
            const dateValue = r.dateSuggested ?? r.date;
            return {
              ...r,
              key: `${g.sheetName}-${r.rowNumber}-${ri}`,
              selected: r.type != null && dateValue !== "",
              dateValue,
            };
          }),
        })),
      );
      setPhase("review");
    } catch (e) {
      toastError(toast, e, { title: "Lecture impossible", fallback: "Fichier Excel invalide." });
    } finally {
      setParsing(false);
    }
  }

  function toggleRow(groupKey: string, rowKey: string, value: boolean) {
    setGroups((prev) =>
      prev.map((g) =>
        g.key !== groupKey
          ? g
          : { ...g, rows: g.rows.map((r) => (r.key === rowKey ? { ...r, selected: value } : r)) },
      ),
    );
  }

  function setRowDate(groupKey: string, rowKey: string, value: string) {
    setGroups((prev) =>
      prev.map((g) =>
        g.key !== groupKey
          ? g
          : { ...g, rows: g.rows.map((r) => (r.key === rowKey ? { ...r, dateValue: value } : r)) },
      ),
    );
  }

  function toggleGroup(groupKey: string, value: boolean) {
    setGroups((prev) =>
      prev.map((g) => (g.key !== groupKey ? g : { ...g, rows: g.rows.map((r) => ({ ...r, selected: value })) })),
    );
  }

  function updateGroupField(groupKey: string, patch: Partial<Pick<ReviewGroup, "marchandise" | "unite" | "seuil">>) {
    setGroups((prev) => prev.map((g) => (g.key === groupKey ? { ...g, ...patch } : g)));
  }

  const groupStats = useMemo(
    () =>
      groups.map((g) => {
        const selected = g.rows.filter((r) => r.selected);
        const invalidSelected = selected.filter((r) => !r.dateValue || r.type == null);
        let running = 0;
        let negativeAt: number | null = null;
        for (const r of selected) {
          if (r.type == null) continue;
          running += r.type === "Entrée" ? r.quantite : -r.quantite;
          if (running < 0 && negativeAt == null) negativeAt = r.rowNumber;
        }
        const entrees = selected.filter((r) => r.type === "Entrée").reduce((sum, r) => sum + r.quantite, 0);
        const sorties = selected.filter((r) => r.type === "Sortie").reduce((sum, r) => sum + r.quantite, 0);
        const checkedState: CheckedState = g.rows.length === 0
          ? false
          : g.rows.every((r) => r.selected)
            ? true
            : g.rows.some((r) => r.selected)
              ? "indeterminate"
              : false;
        return {
          key: g.key,
          selectedCount: selected.length,
          invalidCount: invalidSelected.length,
          stockFinal: running,
          negativeAt,
          entrees,
          sorties,
          checkedState,
          // Marchandise/unité ne sont pas requises pour importer : un nom
          // provisoire (unique par feuille) est utilisé par handleConfirm si
          // elles sont vides, modifiable ensuite depuis Entreposage → Modifier.
          valid: selected.length > 0 && invalidSelected.length === 0 && negativeAt == null,
        };
      }),
    [groups],
  );

  const totalRows = useMemo(() => groups.reduce((sum, g) => sum + g.rows.length, 0), [groups]);
  const totalSelected = useMemo(() => groupStats.reduce((sum, g) => sum + g.selectedCount, 0), [groupStats]);
  const totalInvalid = useMemo(() => groupStats.reduce((sum, g) => sum + g.invalidCount, 0), [groupStats]);
  const totalWarnings = useMemo(
    () => groups.reduce((sum, g) => sum + g.rows.filter((r) => r.selected && r.warnings.length > 0).length, 0),
    [groups],
  );
  const groupsReady = useMemo(
    () => groupStats.filter((g) => g.selectedCount > 0),
    [groupStats],
  );
  const canConfirm =
    groupsReady.length > 0 && groupsReady.every((g) => g.valid) && totalInvalid === 0;

  async function handleConfirm() {
    if (!societeId || !effectiveAnnexeId || !canConfirm) return;

    const toImport = groups.filter((g) => g.rows.some((r) => r.selected));
    setPhase("importing");
    setProgress({ done: 0, total: toImport.length });

    let created = 0;
    let failed = 0;
    let lastError = "";

    for (const g of toImport) {
      try {
        // Nom provisoire unique par feuille si laissé vide — "—" tout court
        // bloquerait la 2e feuille vide d'un classeur multi-articles sur la
        // garde anti-doublon de importStockHistorique (même société/annexe).
        const marchandise = g.marchandise.trim() || `Article à renommer (${g.sheetName})`;
        await importStockHistorique({
          societeId,
          annexeId: effectiveAnnexeId,
          marchandise,
          unite: g.unite.trim(),
          seuil: Math.max(0, Number(g.seuil) || 0),
          clientId: clientId || undefined,
          depositaire: depositaire.trim() || undefined,
          commercial: commercial.trim() || undefined,
          mouvements: g.rows
            .filter((r) => r.selected && r.type != null && r.dateValue)
            .map((r) => ({
              date: r.dateValue,
              type: r.type as "Entrée" | "Sortie",
              quantite: r.quantite,
              responsable: r.designation || "Import historique",
            })),
        });
        created++;
      } catch (e) {
        failed++;
        lastError = getErrorMessage(e);
      } finally {
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
    }

    const description = `${created} article${created !== 1 ? "s" : ""} créé${created !== 1 ? "s" : ""}${
      failed > 0 ? ` — ${failed} échec${failed !== 1 ? "s" : ""} (${lastError})` : ""
    }.`;
    if (failed === 0) {
      toastSuccess(toast, { title: "Import terminé", description });
    } else {
      toastWarning(toast, { title: "Import terminé avec erreurs", description });
    }

    setOpen(false);
    reset();
  }

  if (!canWrite) return null;

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
            phase === "config" ? "sm:max-w-lg" : "sm:max-w-5xl",
          )}
        >
          <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="size-5 text-primary" />
              Import de mouvements de stock historiques
            </DialogTitle>
            <DialogDescription>
              {phase === "config"
                ? "Importez un classeur Excel « grand livre » (une feuille par article) pour créer les articles manquants avec tout leur historique d'entrées/sorties déjà daté."
                : "Vérifiez les lignes détectées avant de les importer. Les dates illisibles ou hors séquence (année/mois incohérent avec les voisins) sont préremplies en ambre — confirmez ou corrigez avant d'importer."}
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
                {showAnnexe && (
                  <div className="space-y-2">
                    <Label>
                      Annexe <span className="text-red-500">*</span>
                    </Label>
                    <Select value={annexeId || undefined} onValueChange={setAnnexeId}>
                      <SelectTrigger aria-label="Sélectionner une annexe">
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
                )}
                <div className="space-y-2">
                  <Label>Nom de l&apos;article</Label>
                  <Input
                    value={defaultMarchandise}
                    onChange={(e) => setDefaultMarchandise(e.target.value)}
                    placeholder="ex. Cube Top Doumani"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unité</Label>
                  <Input
                    value={defaultUnite}
                    onChange={(e) => setDefaultUnite(e.target.value)}
                    placeholder="ex. cartons"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client (optionnel)</Label>
                  <Select value={clientId || "none"} onValueChange={(v) => setClientId(v === "none" ? "" : v)}>
                    <SelectTrigger aria-label="Lier à un client">
                      <SelectValue placeholder="Aucun client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun client</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dépositaire (optionnel)</Label>
                  <Input value={depositaire} onChange={(e) => setDepositaire(e.target.value)} className="h-10" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Commercial (optionnel)</Label>
                  <Input value={commercial} onChange={(e) => setCommercial(e.target.value)} className="h-10" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Renseignés une seule fois ici, le nom de l&apos;article et l&apos;unité préremplissent
                automatiquement la revue qui suit (pratique pour un classeur à un seul article — cas le
                plus courant). Si le classeur mélange plusieurs articles (une feuille chacun), le nom et
                l&apos;unité restent modifiables individuellement par feuille à l&apos;étape suivante.
              </p>

              <div className="rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-700">
                <input
                  type="file"
                  id="stock-bulk-import-file"
                  className="hidden"
                  accept=".xlsx"
                  disabled={!societeId || (showAnnexe && !annexeId) || parsing}
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
                  htmlFor="stock-bulk-import-file"
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary hover:underline",
                    (!societeId || (showAnnexe && !annexeId) || parsing) && "pointer-events-none opacity-60",
                  )}
                >
                  {parsing ? "Analyse du fichier…" : "Sélectionner le fichier .xlsx"}
                </label>
                {fileName && !parsing && (
                  <p className="mt-2 text-xs text-muted-foreground">{fileName}</p>
                )}
              </div>
            </div>
          )}

          {(phase === "review" || phase === "importing") && (
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
              <div className="flex flex-wrap gap-2">
                <StatPill icon={Boxes} value={String(groups.length)} label="article(s) détecté(s)" />
                <StatPill icon={ListChecks} value={String(totalRows)} label="lignes détectées" />
                <StatPill icon={CheckCircle2} value={String(totalSelected)} label="sélectionnées" tone="primary" />
                {totalInvalid > 0 && (
                  <StatPill icon={AlertTriangle} value={String(totalInvalid)} label="date/type invalide" tone="warning" />
                )}
                {totalWarnings > 0 && (
                  <StatPill icon={AlertTriangle} value={String(totalWarnings)} label="ligne(s) avec alerte" tone="warning" />
                )}
              </div>

              <TooltipProvider delayDuration={150}>
                <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background">
                      <TableRow>
                        <TableHead className="w-10" />
                        <TableHead>Date</TableHead>
                        <TableHead>Désignation</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Quantité</TableHead>
                        <TableHead className="text-right">Stock déclaré</TableHead>
                        <TableHead className="text-right">Stock calculé</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groups.map((g) => {
                        const stats = groupStats.find((s) => s.key === g.key)!;
                        return (
                          <Fragment key={g.key}>
                            <TableRow className="border-b border-border bg-slate-50 hover:bg-muted/60">
                              <TableCell className="py-1.5">
                                <Checkbox
                                  checked={stats.checkedState}
                                  disabled={phase === "importing"}
                                  onCheckedChange={(v) => toggleGroup(g.key, v === true)}
                                  aria-label={`Sélectionner toutes les lignes de ${g.sheetName}`}
                                />
                              </TableCell>
                              <TableCell colSpan={7} className="py-1.5">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                                  <Input
                                    value={g.marchandise}
                                    onChange={(e) => updateGroupField(g.key, { marchandise: e.target.value })}
                                    placeholder="Nom de l'article (ex. Cube Top Doumani)"
                                    disabled={phase === "importing"}
                                    className={cn("h-7 w-56 text-xs font-semibold", !g.marchandise.trim() && "border-amber-400")}
                                  />
                                  <Input
                                    value={g.unite}
                                    onChange={(e) => updateGroupField(g.key, { unite: e.target.value })}
                                    placeholder="Unité (cartons…)"
                                    disabled={phase === "importing"}
                                    className={cn("h-7 w-32 text-xs", !g.unite.trim() && "border-amber-400")}
                                  />
                                  <Input
                                    type="number"
                                    min={0}
                                    value={g.seuil}
                                    onChange={(e) => updateGroupField(g.key, { seuil: e.target.value })}
                                    placeholder="Seuil"
                                    disabled={phase === "importing"}
                                    className="h-7 w-20 text-xs"
                                  />
                                  <ToneBadge tone="blue" size="sm">
                                    Nouvel article
                                  </ToneBadge>
                                  <span className="text-[11px] text-muted-foreground">
                                    {g.rows.length} ligne{g.rows.length !== 1 ? "s" : ""} · Entrées {stats.entrees} ·
                                    Sorties {stats.sorties} · Stock final {stats.stockFinal}
                                  </span>
                                  {stats.negativeAt != null && (
                                    <span className="text-[11px] font-medium text-red-600 dark:text-red-400">
                                      Stock négatif à la ligne {stats.negativeAt} avec cette sélection
                                    </span>
                                  )}
                                  {(!g.marchandise.trim() || !g.unite.trim()) && (
                                    <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                      Nom/unité non renseignés — un nom provisoire sera utilisé, modifiable
                                      depuis Entreposage après import.
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                            {g.rows.map((r) => (
                              <TableRow key={r.key} className={cn(!r.selected && "opacity-45")}>
                                <TableCell>
                                  <Checkbox
                                    checked={r.selected}
                                    disabled={phase === "importing"}
                                    onCheckedChange={(v) => toggleRow(g.key, r.key, v === true)}
                                    aria-label={`Inclure la ligne ${r.rowNumber}`}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="date"
                                    value={r.dateValue}
                                    onChange={(e) => setRowDate(g.key, r.key, e.target.value)}
                                    disabled={phase === "importing"}
                                    className={cn(
                                      "h-8 w-36 text-xs",
                                      !r.dateValue && "border-red-400",
                                      r.dateSuggested && r.dateValue === r.dateSuggested && "border-amber-400",
                                    )}
                                  />
                                </TableCell>
                                <TableCell className="max-w-[220px] truncate text-xs" title={r.designation}>
                                  {r.designation || <span className="italic text-muted-foreground">—</span>}
                                </TableCell>
                                <TableCell>
                                  {r.type ? (
                                    <ToneBadge tone={r.type === "Entrée" ? "emerald" : "amber"} size="sm">
                                      <span className="inline-flex items-center gap-1">
                                        {r.type === "Entrée" ? (
                                          <ArrowDownToLine className="size-3" />
                                        ) : (
                                          <ArrowUpFromLine className="size-3" />
                                        )}
                                        {r.type}
                                      </span>
                                    </ToneBadge>
                                  ) : (
                                    <ToneBadge tone="red" size="sm">
                                      Ambigu
                                    </ToneBadge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right text-xs tabular-nums">{r.quantite}</TableCell>
                                <TableCell className="text-right text-xs tabular-nums">
                                  {r.stockDeclare ?? "—"}
                                </TableCell>
                                <TableCell className="text-right text-xs tabular-nums">{r.stockCalcule}</TableCell>
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
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TooltipProvider>

              {totalInvalid > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <p>
                    {totalInvalid} ligne{totalInvalid !== 1 ? "s" : ""} sélectionnée{totalInvalid !== 1 ? "s" : ""}{" "}
                    {totalInvalid !== 1 ? "ont" : "a"} une date manquante/invalide ou un type ambigu (Entrée et
                    Sortie toutes deux renseignées) — corrigez la date ou décochez la ligne avant d&apos;importer.
                  </p>
                </div>
              )}

              {phase === "importing" && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Import en cours… {progress.done}/{progress.total} article(s)
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
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
              <Button onClick={() => void handleConfirm()} disabled={!canConfirm}>
                <CheckCircle2 className="size-4" />
                Importer {groupsReady.length} article{groupsReady.length !== 1 ? "s" : ""} ({totalSelected}{" "}
                mouvement{totalSelected !== 1 ? "s" : ""})
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

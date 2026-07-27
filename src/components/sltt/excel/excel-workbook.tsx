"use client";

import { useEffect, useRef, useState } from "react";
import type { ClasseurEntry } from "@/lib/classeur";
import { useStore } from "@/lib/store";
import { usePermission } from "@/hooks/use-permission";
import { useToast } from "@/hooks/use-toast";
import { buildEmptyWorkbookData } from "@/lib/excel/template";
import { DEFAULT_PAIEMENT_MODE } from "@/lib/constants";
import {
  injectGrandLivre,
  readGrandLivre,
  parseClasseurType,
  type UniverApiLike,
} from "@/lib/excel/sltt-bridge";
import {
  exportGrandLivreToXlsx,
  parseXlsxToGrandLivreRows,
} from "@/lib/excel/workbook-io";
import { ExcelToolbar, type ExcelSaveStatus } from "./excel-toolbar";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ExcelWorkbookPanelProps = {
  clientId: string;
  clientNom: string;
  journalEntries: ClasseurEntry[];
  onApplied?: () => void;
};

export function ExcelWorkbookPanel({
  clientId,
  clientNom,
  journalEntries,
  onApplied,
}: ExcelWorkbookPanelProps) {
  const { toast } = useToast();
  const canWrite = usePermission("comptabilite:write");
  const getExcelWorkbookForClient = useStore((s) => s.getExcelWorkbookForClient);
  const saveExcelWorkbook = useStore((s) => s.saveExcelWorkbook);
  const patchDossierClasseur = useStore((s) => s.patchDossierClasseur);
  const patchEcriture = useStore((s) => s.patchEcriture);
  const patchFactureMontantPaye = useStore((s) => s.patchFactureMontantPaye);
  const addEcriture = useStore((s) => s.addEcriture);

  const containerRef = useRef<HTMLDivElement>(null);
  const univerApiRef = useRef<UniverApiLike | null>(null);
  const disposeRef = useRef<(() => void) | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<ExcelSaveStatus>("idle");
  const [fullscreen, setFullscreen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSave(silent = false) {
    const api = univerApiRef.current;
    if (!api || !canWrite) return;
    const wb = api.getActiveWorkbook();
    if (!wb) return;
    setSaveStatus("saving");
    try {
      const snapshot = wb.save() as Record<string, unknown>;
      await saveExcelWorkbook({
        clientId,
        clientNom,
        snapshotJson: snapshot,
      });
      setSaveStatus("saved");
      if (!silent) {
        toast({ title: "Classeur enregistré" });
      }
    } catch (e) {
      setSaveStatus("error");
      toast({
        title: "Enregistrement impossible",
        description: e instanceof Error ? e.message : "Erreur",
        variant: "destructive",
      });
    }
  }

  const handleSaveRef = useRef(handleSave);
  useEffect(() => {
    handleSaveRef.current = handleSave;
  });

  function scheduleAutosave() {
    if (!canWrite) return;
    setSaveStatus("dirty");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      void handleSaveRef.current(true);
    }, 3000);
  }

  // Boot Univer
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!containerRef.current) return;
      setBootError(null);
      setReady(false);

      try {
        const [{ createUniver, LocaleType, mergeLocales }, { UniverSheetsCorePreset }, localeFr] =
          await Promise.all([
            import("@univerjs/presets"),
            import("@univerjs/preset-sheets-core"),
            import("@univerjs/preset-sheets-core/locales/fr-FR"),
          ]);
        await import("@univerjs/preset-sheets-core/lib/index.css");

        if (cancelled || !containerRef.current) return;

        const existing = await getExcelWorkbookForClient(clientId);
        const snapshot = existing?.snapshotJson as Record<string, unknown> | null | undefined;
        const initialData =
          snapshot && !(snapshot as { truncated?: boolean }).truncated
            ? snapshot
            : buildEmptyWorkbookData(clientNom);

        const { univerAPI } = createUniver({
          locale: LocaleType.FR_FR,
          locales: {
            [LocaleType.FR_FR]: mergeLocales(localeFr.default ?? localeFr),
          },
          presets: [
            UniverSheetsCorePreset({
              container: containerRef.current,
            }),
          ],
        });

        univerAPI.createWorkbook(initialData);
        univerApiRef.current = univerAPI as unknown as UniverApiLike;

        disposeRef.current = () => {
          try {
            univerAPI.dispose();
          } catch {
            // ignore
          }
        };

        if (!cancelled) setReady(true);
      } catch (e) {
        if (!cancelled) {
          setBootError(e instanceof Error ? e.message : "Impossible de charger Excel");
        }
      }
    }

    void boot();

    return () => {
      cancelled = true;
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      disposeRef.current?.();
      disposeRef.current = null;
      univerApiRef.current = null;
    };
  }, [clientId, clientNom, getExcelWorkbookForClient]);

  // Dirty tracking — autosave après édition clavier / pointeur
  useEffect(() => {
    if (!ready || !canWrite) return;
    const el = containerRef.current;
    if (!el) return;
    const onInput = () => {
      setSaveStatus("dirty");
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => {
        void handleSaveRef.current(true);
      }, 3000);
    };
    el.addEventListener("keydown", onInput);
    el.addEventListener("pointerup", onInput);
    return () => {
      el.removeEventListener("keydown", onInput);
      el.removeEventListener("pointerup", onInput);
    };
  }, [ready, canWrite]);

  async function handleRefreshFromSltt() {
    const api = univerApiRef.current;
    if (!api) return;
    setBusy(true);
    try {
      injectGrandLivre(api, journalEntries);
      scheduleAutosave();
      toast({
        title: "GrandLivre actualisé",
        description: `${journalEntries.length} ligne(s) injectée(s) depuis SLTT.`,
      });
    } catch (e) {
      toast({
        title: "Actualisation impossible",
        description: e instanceof Error ? e.message : "Erreur",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleApplyToSltt() {
    const api = univerApiRef.current;
    if (!api || !canWrite) return;
    setBusy(true);
    try {
      const rows = readGrandLivre(api);
      const byRef = new Map(
        journalEntries.map((e) => [e.reference.toLowerCase(), e]),
      );
      let applied = 0;
      let created = 0;

      for (const row of rows) {
        const match = byRef.get(row.reference.toLowerCase());
        if (match) {
          if (match.type === "Dossier") {
            await patchDossierClasseur(match.sourceId, {
              montantInvesti: row.debit,
              montantPaye: row.credit,
            });
            applied++;
          } else if (match.type === "Paiement") {
            await patchEcriture(match.sourceId, {
              montantInvesti: row.debit,
              montantPaye: row.credit,
              note: row.libelle || undefined,
            });
            applied++;
          } else if (match.type === "Facture") {
            await patchFactureMontantPaye(match.sourceId, row.credit);
            applied++;
          }
          continue;
        }

        const type = parseClasseurType(row.type) ?? "Paiement";
        if (type === "Paiement" && (row.debit > 0 || row.credit > 0)) {
          await addEcriture({
            date: row.date || new Date().toISOString().slice(0, 10),
            clientId,
            clientNom,
            montantInvesti: row.debit,
            montantPaye: row.credit,
            modePaiement: DEFAULT_PAIEMENT_MODE,
            note: row.libelle || `Excel · ${row.reference}`,
          });
          created++;
        }
      }

      await handleSave(true);
      onApplied?.();
      toast({
        title: "Appliqué vers SLTT",
        description: `${applied} mise(s) à jour${created ? ` · ${created} écriture(s) créée(s)` : ""}.`,
      });
    } catch (e) {
      toast({
        title: "Application impossible",
        description: e instanceof Error ? e.message : "Erreur",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleExport() {
    const api = univerApiRef.current;
    if (!api) return;
    try {
      const rows = readGrandLivre(api);
      await exportGrandLivreToXlsx(
        rows,
        `classeur-${clientNom.replace(/\s+/g, "-").toLowerCase()}.xlsx`,
      );
      toast({ title: "Export Excel généré" });
    } catch (e) {
      toast({
        title: "Export impossible",
        description: e instanceof Error ? e.message : "Erreur",
        variant: "destructive",
      });
    }
  }

  async function handleImportFile(file: File) {
    const api = univerApiRef.current;
    if (!api || !canWrite) return;
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const rows = await parseXlsxToGrandLivreRows(buf);
      injectGrandLivre(
        api,
        rows.map((r, i) => ({
          id: `import-${i}`,
          sourceId: "",
          date: r.date,
          societeId: "",
          societeNom: r.societeNom,
          type: (parseClasseurType(r.type) ?? "Paiement") as ClasseurEntry["type"],
          reference: r.reference,
          libelle: r.libelle,
          debit: r.debit,
          credit: r.credit,
          statut: r.statut,
          soldeCumule: r.solde,
        })),
      );
      scheduleAutosave();
      toast({
        title: "Import terminé",
        description: `${rows.length} ligne(s) chargée(s) dans GrandLivre.`,
      });
    } catch (e) {
      toast({
        title: "Import impossible",
        description: e instanceof Error ? e.message : "Erreur",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  function handleBold() {
    try {
      const api = univerApiRef.current as unknown as {
        getActiveWorkbook: () => {
          getActiveSheet: () => {
            getSelection?: () => {
              getActiveRange?: () => { setFontWeight: (w: "bold") => void } | null;
            } | null;
          } | null;
        } | null;
      };
      const range = api
        ?.getActiveWorkbook()
        ?.getActiveSheet()
        ?.getSelection?.()
        ?.getActiveRange?.();
      range?.setFontWeight("bold");
      scheduleAutosave();
    } catch {
      // ignore
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-border bg-white shadow-sm dark:bg-slate-950",
        fullscreen && "fixed inset-2 z-50 rounded-xl border-2 border-primary/30",
      )}
    >
      <ExcelToolbar
        canWrite={canWrite}
        saveStatus={saveStatus}
        fullscreen={fullscreen}
        onToggleFullscreen={() => setFullscreen((v) => !v)}
        onSave={() => void handleSave(false)}
        onImport={() => importRef.current?.click()}
        onExport={() => void handleExport()}
        onRefreshFromSltt={() => void handleRefreshFromSltt()}
        onApplyToSltt={() => void handleApplyToSltt()}
        onBold={canWrite ? handleBold : undefined}
        busy={busy || !ready}
      />

      <input
        ref={importRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void handleImportFile(f);
        }}
      />

      <div className="relative min-h-[420px] flex-1" style={{ height: fullscreen ? "calc(100vh - 6rem)" : 480 }}>
        {!ready && !bootError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-slate-950/80">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-slate-500">Chargement du classeur Excel…</span>
          </div>
        )}
        {bootError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-6 text-center text-sm text-destructive">
            {bootError}
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { ClasseurEntry } from "@/lib/classeur";
import { useStore } from "@/lib/store";
import { usePermission } from "@/hooks/use-permission";
import { useToast } from "@/hooks/use-toast";
import { buildEmptyWorkbookData, ensureGrandLivreCapacity } from "@/lib/excel/template";
import { DEFAULT_PAIEMENT_MODE } from "@/lib/constants";
import {
  injectGrandLivre,
  readGrandLivre,
  parseClasseurType,
  setGrandLivreReference,
  ecritureClasseurReference,
  resolveGrandLivreRowCount,
  type UniverApiLike,
} from "@/lib/excel/sltt-bridge";
import {
  exportGrandLivreToXlsx,
  parseXlsxToGrandLivreRows,
  buildGrandLivreXlsxBlob,
} from "@/lib/excel/workbook-io";
import { ExcelToolbar, type ExcelSaveStatus } from "./excel-toolbar";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const SNAPSHOT_MAX_BYTES = 800_000;
const AUTOSAVE_MS = 4000;

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
  const canCompta = usePermission("comptabilite:write");
  const canDossiers = usePermission("dossiers:write");
  const canFactures = usePermission("factures:write");
  const canWrite = canCompta;

  const getExcelWorkbookForClient = useStore((s) => s.getExcelWorkbookForClient);
  const saveExcelWorkbook = useStore((s) => s.saveExcelWorkbook);
  const getSignedExcelWorkbookUrl = useStore((s) => s.getSignedExcelWorkbookUrl);
  const patchDossierClasseur = useStore((s) => s.patchDossierClasseur);
  const patchEcriture = useStore((s) => s.patchEcriture);
  const patchFactureMontantPaye = useStore((s) => s.patchFactureMontantPaye);
  const addEcriture = useStore((s) => s.addEcriture);

  const containerRef = useRef<HTMLDivElement>(null);
  const univerApiRef = useRef<UniverApiLike | null>(null);
  const disposeRef = useRef<(() => void) | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  const saveCtxRef = useRef({
    canWrite,
    clientId,
    clientNom,
    saveExcelWorkbook,
  });
  useEffect(() => {
    saveCtxRef.current = { canWrite, clientId, clientNom, saveExcelWorkbook };
  });

  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<ExcelSaveStatus>("idle");
  const [fullscreen, setFullscreen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function persistWorkbook(silent: boolean) {
    const api = univerApiRef.current;
    const ctx = saveCtxRef.current;
    if (!api || !ctx.canWrite) return;
    const wb = api.getActiveWorkbook();
    if (!wb) return;
    setSaveStatus("saving");
    try {
      const snapshot = wb.save() as Record<string, unknown>;
      let xlsxBlob: Blob | null = null;
      const size = new Blob([JSON.stringify(snapshot)]).size;
      if (size > SNAPSHOT_MAX_BYTES) {
        xlsxBlob = await buildGrandLivreXlsxBlob(readGrandLivre(api));
      }
      await ctx.saveExcelWorkbook({
        clientId: ctx.clientId,
        clientNom: ctx.clientNom,
        snapshotJson: snapshot,
        xlsxBlob,
        silent,
      });
      dirtyRef.current = false;
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

  const persistRef = useRef(persistWorkbook);
  useEffect(() => {
    persistRef.current = persistWorkbook;
  });

  function scheduleAutosave() {
    if (!canWrite) return;
    dirtyRef.current = true;
    setSaveStatus("dirty");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      void persistRef.current(true);
    }, AUTOSAVE_MS);
  }

  // Boot Univer — uniquement quand le conteneur a une largeur réelle
  // (évite "column width is less than 0" si le layout n'est pas prêt).
  useEffect(() => {
    let cancelled = false;

    function waitForContainerWidth(el: HTMLElement, timeoutMs = 5000): Promise<void> {
      if (el.clientWidth > 0) return Promise.resolve();
      return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (ok: boolean) => {
          if (settled) return;
          settled = true;
          window.clearInterval(poll);
          ro.disconnect();
          if (ok) resolve();
          else reject(new Error("Conteneur Excel sans largeur"));
        };
        const started = Date.now();
        const ro = new ResizeObserver(() => {
          if (el.clientWidth > 0) finish(true);
        });
        ro.observe(el);
        const poll = window.setInterval(() => {
          if (cancelled) {
            finish(true); // abandon silencieux via cancelled check après
            return;
          }
          if (el.clientWidth > 0) finish(true);
          else if (Date.now() - started > timeoutMs) finish(false);
        }, 50);
      });
    }

    async function boot() {
      if (!containerRef.current) return;
      setBootError(null);
      setReady(false);

      try {
        await waitForContainerWidth(containerRef.current);
        if (cancelled || !containerRef.current) return;

        const [{ createUniver, LocaleType, mergeLocales }, { UniverSheetsCorePreset }, localeFr] =
          await Promise.all([
            import("@univerjs/presets"),
            import("@univerjs/preset-sheets-core"),
            import("@univerjs/preset-sheets-core/locales/fr-FR"),
          ]);
        await import("@univerjs/preset-sheets-core/lib/index.css");

        if (cancelled || !containerRef.current) return;
        if (containerRef.current.clientWidth <= 0) {
          throw new Error("Conteneur Excel sans largeur");
        }

        const existing = await getExcelWorkbookForClient(clientId);
        const snapshot = existing?.snapshotJson as Record<string, unknown> | null | undefined;
        const isTruncated = Boolean((snapshot as { truncated?: boolean } | null)?.truncated);

        let initialData: Record<string, unknown> = buildEmptyWorkbookData(clientNom);
        let restoreRows: Awaited<ReturnType<typeof parseXlsxToGrandLivreRows>> | null = null;

        if (isTruncated) {
          if (!existing?.storagePath) {
            throw new Error(
              "Classeur tronqué sans fichier de secours Storage. Réimportez un .xlsx ou Actualisez depuis SLTT.",
            );
          }
          const url = await getSignedExcelWorkbookUrl(existing.storagePath);
          const res = await fetch(url);
          if (!res.ok) throw new Error("Impossible de recharger le .xlsx de secours.");
          restoreRows = await parseXlsxToGrandLivreRows(await res.arrayBuffer());
        } else if (snapshot) {
          initialData = ensureGrandLivreCapacity(snapshot);
        } else {
          initialData = ensureGrandLivreCapacity(initialData);
        }

        if (cancelled || !containerRef.current || containerRef.current.clientWidth <= 0) return;

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

        univerAPI.createWorkbook(ensureGrandLivreCapacity(initialData));
        univerApiRef.current = univerAPI as unknown as UniverApiLike;

        if (restoreRows) {
          injectGrandLivre(
            univerApiRef.current,
            restoreRows.map((r, i) => ({
              id: `restore-${i}`,
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
        }

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
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
      // Flush sync avant dispose pour ne pas perdre les 0–4 s d'édition.
      const api = univerApiRef.current;
      const ctx = saveCtxRef.current;
      let snapshot: Record<string, unknown> | null = null;
      if (dirtyRef.current && api && ctx.canWrite) {
        try {
          snapshot = api.getActiveWorkbook()?.save() as Record<string, unknown>;
        } catch {
          snapshot = null;
        }
      }
      disposeRef.current?.();
      disposeRef.current = null;
      univerApiRef.current = null;
      if (snapshot) {
        void (async () => {
          try {
            const size = new Blob([JSON.stringify(snapshot)]).size;
            if (size > SNAPSHOT_MAX_BYTES) {
              console.warn("[Excel] Flush unmount: snapshot trop gros, skip sans xlsx.");
              return;
            }
            await ctx.saveExcelWorkbook({
              clientId: ctx.clientId,
              clientNom: ctx.clientNom,
              snapshotJson: snapshot,
              silent: true,
            });
          } catch (err) {
            console.warn("[Excel] Flush unmount échoué:", err);
          }
        })();
      }
      dirtyRef.current = false;
    };
  }, [clientId, clientNom, getExcelWorkbookForClient, getSignedExcelWorkbookUrl]);

  // Dirty tracking — keydown seulement (pointerup trop bruyant).
  useEffect(() => {
    if (!ready || !canWrite) return;
    const el = containerRef.current;
    if (!el) return;
    const onKey = () => scheduleAutosave();
    el.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("keydown", onKey);
    };
  }, [ready, canWrite]);

  async function handleRefreshFromSltt() {
    const api = univerApiRef.current;
    if (!api) return;
    setBusy(true);
    try {
      const capacity = resolveGrandLivreRowCount(api) - 1;
      if (journalEntries.length > capacity) {
        toast({
          title: "Journal volumineux",
          description: `Plus de ${capacity} lignes : seules les premières seront injectées.`,
          variant: "destructive",
        });
      }
      injectGrandLivre(api, journalEntries.slice(0, Math.max(0, capacity)));
      scheduleAutosave();
      toast({
        title: "GrandLivre actualisé",
        description: `${Math.min(journalEntries.length, Math.max(0, capacity))} ligne(s) injectée(s) depuis SLTT.`,
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
      const capacity = resolveGrandLivreRowCount(api) - 1;
      if (rows.length >= capacity) {
        toast({
          title: "Attention",
          description: `Lecture plafonnée à ${capacity} lignes.`,
        });
      }
      const byRef = new Map(
        journalEntries.map((e) => [e.reference.toLowerCase(), e]),
      );
      let applied = 0;
      let created = 0;
      let skipped = 0;
      const failed: string[] = [];

      for (const row of rows) {
        const match = byRef.get(row.reference.toLowerCase());
        if (match) {
          try {
            if (match.type === "Dossier") {
              if (!canDossiers) {
                failed.push(`${row.reference} (dossiers:write requis)`);
                continue;
              }
              if (match.debit === row.debit && match.credit === row.credit) {
                skipped++;
                continue;
              }
              await patchDossierClasseur(match.sourceId, {
                montantInvesti: row.debit,
                montantPaye: row.credit,
              });
              applied++;
            } else if (match.type === "Paiement") {
              if (!canCompta) {
                failed.push(`${row.reference} (comptabilite:write requis)`);
                continue;
              }
              if (
                match.debit === row.debit &&
                match.credit === row.credit &&
                (match.libelle || "") === (row.libelle || "")
              ) {
                skipped++;
                continue;
              }
              await patchEcriture(match.sourceId, {
                montantInvesti: row.debit,
                montantPaye: row.credit,
                note: row.libelle || undefined,
              });
              applied++;
            } else if (match.type === "Facture") {
              if (!canFactures) {
                failed.push(`${row.reference} (factures:write requis)`);
                continue;
              }
              if (match.credit === row.credit) {
                skipped++;
                continue;
              }
              await patchFactureMontantPaye(match.sourceId, row.credit);
              applied++;
            }
          } catch (e) {
            failed.push(
              `${row.reference}: ${e instanceof Error ? e.message : "erreur"}`,
            );
          }
          continue;
        }

        const type = parseClasseurType(row.type) ?? "Paiement";
        if (type === "Paiement" && (row.debit > 0 || row.credit > 0)) {
          if (!canCompta) {
            failed.push(`${row.reference || row.libelle} (création écriture refusée)`);
            continue;
          }
          try {
            const createdE = await addEcriture({
              date: row.date || new Date().toISOString().slice(0, 10),
              clientId,
              clientNom,
              montantInvesti: row.debit,
              montantPaye: row.credit,
              modePaiement: DEFAULT_PAIEMENT_MODE,
              note: row.libelle || `Excel · ${row.reference}`,
            });
            const canon = ecritureClasseurReference(createdE.id);
            setGrandLivreReference(api, row.sheetRow, canon);
            byRef.set(canon.toLowerCase(), {
              id: createdE.id,
              sourceId: createdE.id,
              date: createdE.date,
              societeId: createdE.societeId || "",
              societeNom: "",
              type: "Paiement",
              reference: canon,
              libelle: createdE.note || "",
              debit: createdE.montantInvesti,
              credit: createdE.montantPaye,
              statut: "",
              soldeCumule: 0,
            });
            created++;
          } catch (e) {
            failed.push(
              `${row.reference || "nouvelle"}: ${e instanceof Error ? e.message : "erreur"}`,
            );
          }
        } else if (type === "Dossier" || type === "Facture") {
          failed.push(`${row.reference || row.libelle} (aucune correspondance SLTT)`);
        }
      }

      await persistWorkbook(true);
      onApplied?.();
      const parts = [
        `${applied} mise(s) à jour`,
        created ? `${created} créée(s)` : null,
        skipped ? `${skipped} inchangée(s)` : null,
        failed.length ? `${failed.length} échec(s)` : null,
      ].filter(Boolean);
      toast({
        title: failed.length ? "Appliqué avec alertes" : "Appliqué vers SLTT",
        description: parts.join(" · ") + (failed.length ? ` — ${failed.slice(0, 3).join("; ")}` : ""),
        variant: failed.length ? "destructive" : undefined,
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
      const parsed = await parseXlsxToGrandLivreRows(buf);
      const capacity = resolveGrandLivreRowCount(api) - 1;
      const rows = parsed.slice(0, Math.max(0, capacity));
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
        description:
          parsed.length > rows.length
            ? `${rows.length}/${parsed.length} ligne(s) importée(s) (capacité feuille). Appliquer pour pousser vers SLTT.`
            : `${rows.length} ligne(s) chargée(s) dans GrandLivre. Utilisez Appliquer pour pousser vers SLTT.`,
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
        onSave={() => void persistWorkbook(false)}
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

      <div
        className="relative min-h-[420px] flex-1"
        style={{ height: fullscreen ? "calc(100vh - 6rem)" : 480 }}
      >
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

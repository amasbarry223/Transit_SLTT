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
  normalizeClasseurRef,
  resolveGrandLivreRowCount,
  type UniverApiLike,
} from "@/lib/excel/sltt-bridge";
import {
  exportGrandLivreToXlsx,
  parseXlsxToGrandLivreRows,
  buildGrandLivreXlsxBlob,
} from "@/lib/excel/workbook-io";
import { ExcelToolbar, type ExcelSaveStatus } from "./excel-toolbar";
import { excelTheme } from "@/lib/excel/excel-theme";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import "./excel-skin.css";

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

  // Boot Univer — attendre largeur ET hauteur réelles
  // (sinon grille blanche + zoom aberrant type 333%).
  useEffect(() => {
    let cancelled = false;
    let resizeRo: ResizeObserver | null = null;

    function isContainerReady(el: HTMLElement) {
      return el.clientWidth >= 80 && el.clientHeight >= 200;
    }

    function waitForContainer(el: HTMLElement, timeoutMs = 8000): Promise<void> {
      if (isContainerReady(el)) return Promise.resolve();
      return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (ok: boolean) => {
          if (settled) return;
          settled = true;
          window.clearInterval(poll);
          ro.disconnect();
          if (ok) resolve();
          else reject(new Error("Conteneur Excel trop petit (largeur/hauteur)"));
        };
        const started = Date.now();
        const ro = new ResizeObserver(() => {
          if (isContainerReady(el)) finish(true);
        });
        ro.observe(el);
        const poll = window.setInterval(() => {
          if (cancelled) {
            finish(true);
            return;
          }
          if (isContainerReady(el)) finish(true);
          else if (Date.now() - started > timeoutMs) finish(false);
        }, 50);
      });
    }

    function nudgeUniverLayout(host: HTMLElement) {
      // Force un recalcul de layout après paint (canvas / zoom).
      window.dispatchEvent(new Event("resize"));
      host.querySelectorAll("canvas").forEach((c) => {
        const parent = c.parentElement;
        if (parent && parent.clientHeight > 0) {
          c.style.maxHeight = "100%";
        }
      });
    }

    async function boot() {
      if (!containerRef.current) return;
      setBootError(null);
      setReady(false);

      try {
        await waitForContainer(containerRef.current);
        if (cancelled || !containerRef.current) return;

        const [{ createUniver, LocaleType, mergeLocales }, { UniverSheetsCorePreset }, localeFr] =
          await Promise.all([
            import("@univerjs/presets"),
            import("@univerjs/preset-sheets-core"),
            import("@univerjs/preset-sheets-core/locales/fr-FR"),
          ]);
        await import("@univerjs/preset-sheets-core/lib/index.css");

        if (cancelled || !containerRef.current) return;
        if (!isContainerReady(containerRef.current)) {
          throw new Error("Conteneur Excel trop petit (largeur/hauteur)");
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

        if (cancelled || !containerRef.current || !isContainerReady(containerRef.current)) return;

        const host = containerRef.current;
        const { univerAPI } = createUniver({
          theme: excelTheme,
          locale: LocaleType.FR_FR,
          locales: {
            [LocaleType.FR_FR]: mergeLocales(localeFr.default ?? localeFr),
          },
          presets: [
            UniverSheetsCorePreset({
              container: host,
            }),
          ],
        });

        univerAPI.createWorkbook(ensureGrandLivreCapacity(initialData));
        univerApiRef.current = univerAPI as unknown as UniverApiLike;

        // Recalcul layout après paint (évite canvas à hauteur 0).
        // Ne pas appeler sheet.zoom/setZoomRatio : nécessite SheetsZoomRenderController
        // non fourni par le preset core.
        requestAnimationFrame(() => {
          if (!cancelled) nudgeUniverLayout(host);
        });

        resizeRo = new ResizeObserver(() => {
          if (!cancelled) nudgeUniverLayout(host);
        });
        resizeRo.observe(host);

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
      resizeRo?.disconnect();
      resizeRo = null;
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
      // Flush avant dispose — y compris xlsx si snapshot > plafond (évite perte silencieuse).
      const api = univerApiRef.current;
      const ctx = saveCtxRef.current;
      const dispose = disposeRef.current;
      const shouldFlush = Boolean(dirtyRef.current && api && ctx.canWrite);
      dirtyRef.current = false;
      disposeRef.current = null;
      univerApiRef.current = null;

      void (async () => {
        try {
          if (shouldFlush && api) {
            const snapshot = api.getActiveWorkbook()?.save() as Record<string, unknown> | undefined;
            if (!snapshot) return;
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
              silent: true,
            });
          }
        } catch (err) {
          console.warn("[Excel] Flush unmount échoué:", err);
        } finally {
          try {
            dispose?.();
          } catch {
            // ignore
          }
        }
      })();
    };
  }, [clientId, clientNom, getExcelWorkbookForClient, getSignedExcelWorkbookUrl]);

  // Dirty tracking : clavier + collage (édition souris seule peut manquer un autosave).
  useEffect(() => {
    if (!ready || !canWrite) return;
    const el = containerRef.current;
    if (!el) return;
    const markDirty = () => scheduleAutosave();
    el.addEventListener("keydown", markDirty);
    el.addEventListener("paste", markDirty);
    el.addEventListener("input", markDirty);
    return () => {
      el.removeEventListener("keydown", markDirty);
      el.removeEventListener("paste", markDirty);
      el.removeEventListener("input", markDirty);
    };
  }, [ready, canWrite]);

  async function handleRefreshFromSltt() {
    const api = univerApiRef.current;
    if (!api) return;
    if (dirtyRef.current || saveStatus === "dirty") {
      const ok = window.confirm(
        "Des modifications non enregistrées seront remplacées par le journal SLTT. Continuer ?",
      );
      if (!ok) return;
    }
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
        journalEntries.map((e) => [normalizeClasseurRef(e.reference), e]),
      );
      const processedRefs = new Set<string>();

      type PlannedOp =
        | { kind: "skip" }
        | {
            kind: "patch-dossier";
            row: (typeof rows)[number];
            sourceId: string;
            debit: number;
            credit: number;
          }
        | {
            kind: "patch-paiement";
            row: (typeof rows)[number];
            sourceId: string;
            debit: number;
            credit: number;
            libelle: string;
          }
        | {
            kind: "patch-facture";
            row: (typeof rows)[number];
            sourceId: string;
            credit: number;
          }
        | {
            kind: "create-paiement";
            row: (typeof rows)[number];
          };

      const planned: PlannedOp[] = [];
      const preFailed: string[] = [];
      let skipped = 0;

      // Phase 1 — dry-run : aucune écriture DB.
      for (const row of rows) {
        const refKey = normalizeClasseurRef(row.reference);
        if (refKey) {
          if (processedRefs.has(refKey)) {
            skipped++;
            planned.push({ kind: "skip" });
            continue;
          }
          processedRefs.add(refKey);
        }
        const match = refKey ? byRef.get(refKey) : undefined;
        if (match) {
          if (match.type === "Dossier") {
            if (!canDossiers) {
              preFailed.push(`${row.reference} (dossiers:write requis)`);
              continue;
            }
            if (match.debit === row.debit && match.credit === row.credit) {
              skipped++;
              planned.push({ kind: "skip" });
              continue;
            }
            planned.push({
              kind: "patch-dossier",
              row,
              sourceId: match.sourceId,
              debit: row.debit,
              credit: row.credit,
            });
          } else if (match.type === "Paiement") {
            if (!canCompta) {
              preFailed.push(`${row.reference} (comptabilite:write requis)`);
              continue;
            }
            if (
              match.debit === row.debit &&
              match.credit === row.credit &&
              (match.libelle || "") === (row.libelle || "")
            ) {
              skipped++;
              planned.push({ kind: "skip" });
              continue;
            }
            planned.push({
              kind: "patch-paiement",
              row,
              sourceId: match.sourceId,
              debit: row.debit,
              credit: row.credit,
              libelle: row.libelle || "",
            });
          } else if (match.type === "Facture") {
            if (!canFactures) {
              preFailed.push(`${row.reference} (factures:write requis)`);
              continue;
            }
            if (match.credit === row.credit) {
              skipped++;
              planned.push({ kind: "skip" });
              continue;
            }
            planned.push({
              kind: "patch-facture",
              row,
              sourceId: match.sourceId,
              credit: row.credit,
            });
          }
          continue;
        }

        const type = parseClasseurType(row.type) ?? "Paiement";
        if (type === "Paiement" && (row.debit > 0 || row.credit > 0)) {
          if (!refKey) {
            preFailed.push(`${row.libelle || "ligne"} (référence Excel obligatoire)`);
            continue;
          }
          if (!canCompta) {
            preFailed.push(`${row.reference || row.libelle} (création écriture refusée)`);
            continue;
          }
          planned.push({ kind: "create-paiement", row });
        } else if (type === "Dossier" || type === "Facture") {
          preFailed.push(`${row.reference || row.libelle} (aucune correspondance SLTT)`);
        }
      }

      const mutations = planned.filter((p) => p.kind !== "skip");
      if (mutations.length === 0 && preFailed.length === 0) {
        toast({
          title: "Rien à appliquer",
          description: skipped
            ? `${skipped} ligne(s) déjà synchronisée(s).`
            : "Aucune ligne modifiable détectée.",
        });
        return;
      }

      if (preFailed.length > 0) {
        const preview = preFailed.slice(0, 8).join("\n• ");
        const ok = window.confirm(
          `${preFailed.length} ligne(s) seront ignorées :\n• ${preview}${
            preFailed.length > 8 ? "\n…" : ""
          }\n\nAppliquer les ${mutations.length} autre(s) modification(s) ?`,
        );
        if (!ok) return;
      } else if (mutations.length > 0) {
        const ok = window.confirm(
          `Appliquer ${mutations.length} modification(s) vers SLTT ?\n(${skipped} inchangée(s))`,
        );
        if (!ok) return;
      }

      // Phase 2 — exécution séquentielle (rapport complet en cas d'échec partiel).
      let applied = 0;
      let created = 0;
      const failed = [...preFailed];

      for (const op of planned) {
        if (op.kind === "skip") continue;
        try {
          if (op.kind === "patch-dossier") {
            await patchDossierClasseur(op.sourceId, {
              montantInvesti: op.debit,
              montantPaye: op.credit,
            });
            applied++;
          } else if (op.kind === "patch-paiement") {
            await patchEcriture(op.sourceId, {
              montantInvesti: op.debit,
              montantPaye: op.credit,
              note: op.libelle || undefined,
            });
            applied++;
          } else if (op.kind === "patch-facture") {
            await patchFactureMontantPaye(op.sourceId, op.credit);
            applied++;
          } else if (op.kind === "create-paiement") {
            const createdE = await addEcriture({
              date: op.row.date || new Date().toISOString().slice(0, 10),
              clientId,
              clientNom,
              montantInvesti: op.row.debit,
              montantPaye: op.row.credit,
              modePaiement: DEFAULT_PAIEMENT_MODE,
              note: op.row.libelle || `Excel · ${op.row.reference}`,
            });
            const canon = ecritureClasseurReference(createdE.id);
            setGrandLivreReference(api, op.row.sheetRow, canon);
            byRef.set(normalizeClasseurRef(canon), {
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
          }
        } catch (e) {
          const label =
            op.kind === "create-paiement"
              ? op.row.reference || "nouvelle"
              : op.row.reference;
          failed.push(`${label}: ${e instanceof Error ? e.message : "erreur"}`);
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
      const failDetail =
        failed.length > 0
          ? ` — ${failed.slice(0, 6).join("; ")}${failed.length > 6 ? ` (+${failed.length - 6})` : ""}`
          : "";
      toast({
        title: failed.length ? "Appliqué avec alertes" : "Appliqué vers SLTT",
        description: parts.join(" · ") + failDetail,
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

  return (
    <div
      className={cn(
        "sltt-excel-shell flex flex-col",
        fullscreen && "sltt-excel-shell--fullscreen fixed inset-2 z-50",
      )}
    >
      <ExcelToolbar
        clientNom={clientNom}
        canWrite={canWrite}
        saveStatus={saveStatus}
        fullscreen={fullscreen}
        onToggleFullscreen={() => setFullscreen((v) => !v)}
        onSave={() => void persistWorkbook(false)}
        onImport={() => importRef.current?.click()}
        onExport={() => void handleExport()}
        onRefreshFromSltt={() => void handleRefreshFromSltt()}
        onApplyToSltt={() => void handleApplyToSltt()}
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

      <div className="sltt-excel-viewport">
        {!ready && !bootError && (
          <div className="sltt-excel-overlay">
            <Loader2 className="size-5 animate-spin" />
            <span>Chargement du classeur Excel…</span>
          </div>
        )}
        {bootError && (
          <div className="sltt-excel-overlay sltt-excel-overlay--error">{bootError}</div>
        )}
        <div ref={containerRef} className="sltt-excel-host" />
      </div>

      <div className="sltt-excel-statusbar">
        <span className="sltt-excel-statusbar__ready">
          {ready ? "Prêt" : bootError ? "Erreur" : "Chargement…"}
        </span>
        <span className="truncate text-[11px] text-[#605e5c]">
          Feuilles GrandLivre · Notes — sync SLTT
        </span>
      </div>
    </div>
  );
}

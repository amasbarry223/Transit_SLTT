"use client";

import type { ClasseurEntry } from "@/lib/classeur";
import { ExcelToolbar } from "./excel-toolbar";
import { ConfirmActionDialog } from "@/components/sltt/confirm-action-dialog";
import { useExcelWorkbook } from "./use-excel-workbook";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import "./excel-skin.css";

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
  const {
    containerRef,
    importRef,
    ready,
    bootError,
    saveStatus,
    fullscreen,
    toggleFullscreen,
    busy,
    canWrite,
    pendingConfirm,
    setPendingConfirm,
    persistWorkbook,
    handleExport,
    handleImportInputChange,
    handleRefreshFromSltt,
    handleApplyToSltt,
    handleConfirmAction,
  } = useExcelWorkbook({ clientId, clientNom, journalEntries, onApplied });

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
        onToggleFullscreen={toggleFullscreen}
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
        onChange={handleImportInputChange}
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

      <ConfirmActionDialog
        open={!!pendingConfirm}
        onOpenChange={(open) => !open && setPendingConfirm(null)}
        title={pendingConfirm?.title ?? ""}
        description={pendingConfirm?.description ?? ""}
        confirmLabel="Continuer"
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}

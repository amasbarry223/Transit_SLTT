"use client";

import {
  Bold,
  Download,
  Upload,
  Save,
  RefreshCw,
  UploadCloud,
  Maximize2,
  Minimize2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ExcelSaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export function ExcelToolbar({
  canWrite,
  saveStatus,
  fullscreen,
  onToggleFullscreen,
  onSave,
  onImport,
  onExport,
  onRefreshFromSltt,
  onApplyToSltt,
  onBold,
  busy = false,
}: {
  canWrite: boolean;
  saveStatus: ExcelSaveStatus;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onSave: () => void;
  onImport: () => void;
  onExport: () => void;
  onRefreshFromSltt: () => void;
  onApplyToSltt: () => void;
  onBold?: () => void;
  busy?: boolean;
}) {
  const statusLabel =
    saveStatus === "saving"
      ? "Enregistrement…"
      : saveStatus === "saved"
        ? "Enregistré"
        : saveStatus === "dirty"
          ? "Modifications non enregistrées"
          : saveStatus === "error"
            ? "Erreur d'enregistrement"
            : "À jour";

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-slate-50/90 px-3 py-2 dark:bg-slate-900/80">
      <div className="flex flex-wrap items-center gap-1">
        {canWrite && (
          <>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-8"
              disabled={busy || saveStatus === "saving"}
              onClick={onSave}
            >
              {saveStatus === "saving" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Enregistrer
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              disabled={busy}
              onClick={onImport}
              title="Importer un fichier .xlsx"
            >
              <Upload className="size-3.5" />
              <span className="hidden sm:inline">Importer</span>
            </Button>
          </>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          disabled={busy}
          onClick={onExport}
        >
          <Download className="size-3.5" />
          <span className="hidden sm:inline">Exporter</span>
        </Button>
      </div>

      <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

      <div className="flex flex-wrap items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          disabled={busy}
          onClick={onRefreshFromSltt}
          title="Injecter le journal SLTT dans GrandLivre"
        >
          <RefreshCw className="size-3.5" />
          <span className="hidden md:inline">Actualiser depuis SLTT</span>
          <span className="md:hidden">Actualiser</span>
        </Button>
        {canWrite && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-primary/40 text-primary"
            disabled={busy}
            onClick={onApplyToSltt}
            title="Écrire GrandLivre vers dossiers / écritures / factures"
          >
            <UploadCloud className="size-3.5" />
            <span className="hidden md:inline">Appliquer vers SLTT</span>
            <span className="md:hidden">Appliquer</span>
          </Button>
        )}
        {canWrite && onBold && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 px-0"
            disabled={busy}
            onClick={onBold}
            title="Gras"
          >
            <Bold className="size-3.5" />
          </Button>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span
          className={cn(
            "text-[11px] tabular-nums",
            saveStatus === "error"
              ? "text-destructive"
              : saveStatus === "dirty"
                ? "text-amber-600 dark:text-amber-400"
                : "text-slate-500",
          )}
        >
          {statusLabel}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 px-0"
          onClick={onToggleFullscreen}
          title={fullscreen ? "Quitter le plein écran" : "Plein écran"}
        >
          {fullscreen ? (
            <Minimize2 className="size-3.5" />
          ) : (
            <Maximize2 className="size-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

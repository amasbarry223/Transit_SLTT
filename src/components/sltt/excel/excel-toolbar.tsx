"use client";

import type { ReactNode } from "react";
import {
  Download,
  Upload,
  Save,
  RefreshCw,
  UploadCloud,
  Maximize2,
  Minimize2,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ExcelSaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

function QuickBtn({
  children,
  onClick,
  disabled,
  title,
  variant = "default",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  variant?: "default" | "primary" | "accent";
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "sltt-excel-quickbar__btn",
        variant === "primary" && "sltt-excel-quickbar__btn--primary",
        variant === "accent" && "sltt-excel-quickbar__btn--accent",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function ExcelToolbar({
  clientNom,
  canWrite,
  saveStatus,
  fullscreen,
  onToggleFullscreen,
  onSave,
  onImport,
  onExport,
  onRefreshFromSltt,
  onApplyToSltt,
  busy = false,
}: {
  clientNom: string;
  canWrite: boolean;
  saveStatus: ExcelSaveStatus;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onSave: () => void;
  onImport: () => void;
  onExport: () => void;
  onRefreshFromSltt: () => void;
  onApplyToSltt: () => void;
  busy?: boolean;
}) {
  const statusLabel =
    saveStatus === "saving"
      ? "Enregistrement…"
      : saveStatus === "saved"
        ? "Enregistré"
        : saveStatus === "dirty"
          ? "Non enregistré"
          : saveStatus === "error"
            ? "Erreur"
            : "À jour";

  return (
    <>
      <div className="sltt-excel-titlebar">
        <div className="sltt-excel-titlebar__brand">
          <FileSpreadsheet className="size-4" aria-hidden />
          <span>Excel</span>
        </div>
        <div className="sltt-excel-titlebar__doc" title={`Classeur ${clientNom}`}>
          Classeur {clientNom} — SLTT
        </div>
        <div className="sltt-excel-titlebar__actions">
          <span
            className={cn(
              "sltt-excel-titlebar__status",
              saveStatus === "dirty" && "is-dirty",
              saveStatus === "error" && "is-error",
            )}
          >
            {statusLabel}
          </span>
          <button
            type="button"
            className="sltt-excel-titlebar__btn"
            title={fullscreen ? "Quitter le plein écran" : "Plein écran"}
            onClick={onToggleFullscreen}
          >
            {fullscreen ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className="sltt-excel-quickbar">
        <div className="sltt-excel-quickbar__group">
          {canWrite && (
            <QuickBtn
              variant="primary"
              disabled={busy || saveStatus === "saving"}
              onClick={onSave}
              title="Enregistrer le classeur"
            >
              {saveStatus === "saving" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              <span>Enregistrer</span>
            </QuickBtn>
          )}
          {canWrite && (
            <QuickBtn disabled={busy} onClick={onImport} title="Importer un fichier .xlsx">
              <Upload className="size-3.5" />
              <span className="hidden sm:inline">Importer</span>
            </QuickBtn>
          )}
          <QuickBtn disabled={busy} onClick={onExport} title="Exporter en .xlsx">
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Exporter</span>
          </QuickBtn>
        </div>

        <div className="sltt-excel-quickbar__sep hidden sm:block" />

        <div className="sltt-excel-quickbar__group">
          <QuickBtn
            disabled={busy}
            onClick={onRefreshFromSltt}
            title="Injecter le journal SLTT dans GrandLivre"
          >
            <RefreshCw className="size-3.5" />
            <span className="hidden md:inline">Actualiser depuis SLTT</span>
            <span className="md:hidden">Actualiser</span>
          </QuickBtn>
          {canWrite && (
            <QuickBtn
              variant="accent"
              disabled={busy}
              onClick={onApplyToSltt}
              title="Écrire GrandLivre vers dossiers / écritures / factures"
            >
              <UploadCloud className="size-3.5" />
              <span className="hidden md:inline">Appliquer vers SLTT</span>
              <span className="md:hidden">Appliquer</span>
            </QuickBtn>
          )}
        </div>
      </div>
    </>
  );
}

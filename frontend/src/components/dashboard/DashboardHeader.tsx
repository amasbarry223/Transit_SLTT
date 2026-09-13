"use client";

import React from "react";
import { Plus, BellRing, Calendar, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface DashboardHeaderProps {
  userName?: string | null;
  activeAnnexeName?: string;
  onNewDossier: () => void;
  onViewAlerts: () => void;
  canCreateDossier?: boolean;
  alertCount?: number;
}

export function DashboardHeader({
  userName,
  activeAnnexeName = "Toutes les annexes (Siège Bamako)",
  onNewDossier,
  onViewAlerts,
  canCreateDossier = true,
  alertCount = 5,
}: DashboardHeaderProps) {
  const firstName = userName ? userName.split(" ")[0] : "Amadou";

  const currentDateFormatted = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).replace(/^\w/, (c) => c.toUpperCase());

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B2A78] via-[#103B9B] to-[#1E40AF] text-white shadow-lg border border-blue-900/50">
      {/* Motifs géométriques & skyline logistique en filigrane */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="absolute -right-12 -bottom-16 w-80 h-80 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between gap-5 p-6 sm:p-7 md:flex-row md:items-center">
        {/* Titres & badges de contexte */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-blue-200/90 font-medium">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 backdrop-blur-xs border border-white/15">
              <Calendar className="size-3.5 text-blue-300" />
              {currentDateFormatted}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 backdrop-blur-xs border border-white/15">
              <MapPin className="size-3.5 text-blue-300" />
              {activeAnnexeName}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Opérations fluides
            </span>
          </div>

          <div className="pt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Bonjour, {firstName} <span className="inline-block animate-wave origin-bottom-right">👋</span>
            </h1>
            <p className="text-sm text-blue-100/85 mt-1 max-w-2xl font-normal leading-relaxed">
              Voici l&apos;état actuel des opérations de transit, dédouanement et trésorerie de <span className="font-semibold text-white">SLTT</span>. Restez informé en temps réel.
            </p>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            onClick={onViewAlerts}
            variant="outline"
            className="rounded-xl border-white/25 bg-white/10 hover:bg-white/20 text-white font-medium backdrop-blur-xs transition-all flex items-center gap-2 text-xs sm:text-sm h-10 px-4"
          >
            <BellRing className="size-4 text-amber-300" />
            <span>Voir les alertes</span>
            {alertCount > 0 && (
              <span className="ml-1 rounded-full bg-[#ED1C24] px-1.5 py-0.2 text-[10px] font-black text-white">
                {alertCount}
              </span>
            )}
          </Button>

          {canCreateDossier && (
            <Button
              onClick={onNewDossier}
              className="rounded-xl bg-[#ED1C24] hover:bg-[#D9161E] text-white font-bold shadow-md shadow-red-950/40 border border-red-500/40 transition-all flex items-center gap-2 text-xs sm:text-sm h-10 px-4.5"
            >
              <Plus className="size-4 stroke-[3]" />
              <span>Nouveau dossier</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Gauge, Clock, CheckCircle, AlertOctagon, Container, TrendingUp } from "lucide-react";
import type { TransitPerformanceKPI } from "@/mock/dashboard";

interface TransitPerformanceProps {
  performance: TransitPerformanceKPI;
  onViewDossiersBloques?: () => void;
  onViewConteneurs?: () => void;
}

export function TransitPerformance({
  performance,
  onViewDossiersBloques,
  onViewConteneurs,
}: TransitPerformanceProps) {
  const { delaiMoyenDedouanementJours, tauxDossiersLivresATemps, dossiersBloques, conteneursEnTransit } = performance;

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-border/70 bg-white dark:bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              <Gauge className="size-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Performance logistique & transit
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Indicateurs d&apos;efficacité opérationnelle sur les corridors
          </p>
        </div>
      </div>

      {/* Grille 4 KPI */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* 1. Délai moyen */}
        <div className="rounded-xl p-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
            <Clock className="size-3.5 text-blue-500" />
            <span className="text-[11px] font-semibold">Délai dédouanement</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {delaiMoyenDedouanementJours} <span className="text-xs font-normal text-slate-400">jours</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">
            -0.4j vs mois dernier
          </span>
        </div>

        {/* 2. Taux livraison à temps */}
        <div className="rounded-xl p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/40">
          <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 mb-1">
            <CheckCircle className="size-3.5 text-emerald-600" />
            <span className="text-[11px] font-semibold">Livrés à temps</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300">
            {tauxDossiersLivresATemps}%
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">
            Objectif SLTT : &gt;85%
          </span>
        </div>

        {/* 3. Dossiers bloqués */}
        <div
          onClick={onViewDossiersBloques}
          className="rounded-xl p-3.5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900/40 cursor-pointer hover:bg-rose-100/60 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 mb-1">
            <AlertOctagon className="size-3.5 text-rose-600" />
            <span className="text-[11px] font-semibold">Dossiers bloqués</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-300">
            {dossiersBloques}
          </div>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium mt-1 block">
            Attente quittance / visite
          </span>
        </div>

        {/* 4. Conteneurs en transit */}
        <div
          onClick={onViewConteneurs}
          className="rounded-xl p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 cursor-pointer hover:bg-blue-100/60 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-300 mb-1">
            <Container className="size-3.5 text-blue-600" />
            <span className="text-[11px] font-semibold">Conteneurs en transit</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-300">
            {conteneursEnTransit} <span className="text-xs font-normal text-slate-400">TC</span>
          </div>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-1 block">
            Corridor Abidjan ↔ Bamako
          </span>
        </div>
      </div>
    </div>
  );
}

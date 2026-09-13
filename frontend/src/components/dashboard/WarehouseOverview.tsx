"use client";

import React from "react";
import { Warehouse, Boxes, Layers } from "lucide-react";
import type { WarehouseStats } from "@/mock/dashboard";
import { cn } from "@/shared/utils/cn";

interface WarehouseOverviewProps {
  stats: WarehouseStats;
  onGoToWarehouse?: () => void;
}

export function WarehouseOverview({ stats, onGoToWarehouse }: WarehouseOverviewProps) {
  const { capaciteTotaleM3, capaciteUtiliseeM3, capaciteDisponibleM3, tauxOccupation, categories } = stats;

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-border/70 bg-white dark:bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
              <Warehouse className="size-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Occupation des entrepôts
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Magasinage & aires sous douane (MAD)
          </p>
        </div>

        {onGoToWarehouse && (
          <button
            type="button"
            onClick={onGoToWarehouse}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
          >
            Gérer
          </button>
        )}
      </div>

      {/* Jauge globale d'occupation */}
      <div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 mb-4">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Taux d&apos;occupation global
          </span>
          <span className="font-black text-slate-900 dark:text-white">
            {tauxOccupation}% ({capaciteUtiliseeM3} m³ / {capaciteTotaleM3} m³)
          </span>
        </div>

        {/* Barre de progression avec indicateur de saturation */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden flex">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              tauxOccupation > 85 ? "bg-rose-500" : tauxOccupation > 70 ? "bg-amber-500" : "bg-teal-500"
            )}
            style={{ width: `${tauxOccupation}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
          <span>{capaciteUtiliseeM3} m³ occupés</span>
          <span>{capaciteDisponibleM3} m³ disponibles</span>
        </div>
      </div>

      {/* Ventilation par catégorie avec barres horizontales */}
      <div className="space-y-2.5">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
          Répartition par type de fret
        </span>

        {categories.map((cat) => (
          <div key={cat.category} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 truncate">
                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                {cat.category}
              </span>
              <span className="font-bold text-slate-900 dark:text-white shrink-0">
                {cat.volumeM3} m³ ({cat.unitesCount})
              </span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Navigation, MapPin, Truck, Ship, CheckCircle2 } from "lucide-react";

export function CorridorTrackingMap() {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-border/70 bg-white dark:bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <Navigation className="size-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Localisation des opérations
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Suivi en temps réel corridor Abidjan ↔ Bamako (Mali - Côte d&apos;Ivoire)
          </p>
        </div>
      </div>

      {/* Carte SVG stylisée du Corridor */}
      <div className="relative rounded-xl bg-gradient-to-b from-slate-50 to-blue-50/40 dark:from-slate-900/60 dark:to-blue-950/20 border border-slate-100 dark:border-slate-800/80 p-4 my-2 overflow-hidden min-h-[160px] flex items-center justify-center">
        {/* Lignes de repères et trajectoires */}
        <svg className="w-full h-36" viewBox="0 0 400 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ligne pointillée du corridor */}
          <path
            d="M 50 110 C 130 90, 200 60, 340 30"
            stroke="#94A3B8"
            strokeWidth="3"
            strokeDasharray="6 6"
            className="dark:stroke-slate-700"
          />
          {/* Tronçon actif en transit */}
          <path
            d="M 170 70 C 230 50, 280 40, 340 30"
            stroke="#2563EB"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Point 1 : Port d'Abidjan */}
          <g transform="translate(50, 110)">
            <circle r="12" fill="#2563EB" fillOpacity="0.2" className="animate-ping" />
            <circle r="7" fill="#2563EB" />
            <text x="-25" y="22" fill="#1E293B" className="text-[10px] font-bold dark:fill-slate-200">
              Port Abidjan
            </text>
            <text x="-25" y="32" fill="#64748B" className="text-[8px]">
              18 TC au quai
            </text>
          </g>

          {/* Point 2 : Frontière Zégoua */}
          <g transform="translate(195, 63)">
            <circle r="10" fill="#F59E0B" fillOpacity="0.2" className="animate-pulse" />
            <circle r="6" fill="#F59E0B" />
            <text x="-20" y="-12" fill="#1E293B" className="text-[10px] font-bold dark:fill-slate-200">
              Zégoua (Douane)
            </text>
            <text x="-20" y="-2" fill="#64748B" className="text-[8px]">
              Poste frontière
            </text>
          </g>

          {/* Camion en transit sur la route */}
          <g transform="translate(265, 45)">
            <rect x="-12" y="-9" width="24" height="18" rx="4" fill="#10B981" />
            <circle cx="-5" cy="9" r="2.5" fill="#1F2937" />
            <circle cx="5" cy="9" r="2.5" fill="#1F2937" />
            <text x="-16" y="-12" fill="#10B981" className="text-[9px] font-bold">
              14 Camions
            </text>
          </g>

          {/* Point 3 : Bamako Faladié / Siège */}
          <g transform="translate(340, 30)">
            <circle r="14" fill="#10B981" fillOpacity="0.2" className="animate-pulse" />
            <circle r="8" fill="#10B981" />
            <text x="-35" y="-14" fill="#1E293B" className="text-[10px] font-bold dark:fill-slate-200">
              Bamako (Siège & MAD)
            </text>
            <text x="-35" y="-4" fill="#64748B" className="text-[8px]">
              Livraisons & MAD
            </text>
          </g>
        </svg>
      </div>

      {/* Légende en bas */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#2563EB]" />
          <span className="text-slate-600 dark:text-slate-400">En transit portuaire</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#F59E0B]" />
          <span className="text-slate-600 dark:text-slate-400">En cours douane</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#10B981]" />
          <span className="text-slate-600 dark:text-slate-400">Livré / Entrepôt</span>
        </div>
      </div>
    </div>
  );
}

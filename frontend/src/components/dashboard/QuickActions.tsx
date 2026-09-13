"use client";

import React from "react";
import {
  FolderPlus,
  FilePlus2,
  Receipt,
  Wallet,
  Warehouse,
  BookOpenCheck,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface QuickActionsProps {
  onAction: (actionKey: string) => void;
}

export function QuickActions({ onAction }: QuickActionsProps) {
  const actions = [
    {
      key: "nouveau-dossier",
      label: "Nouveau dossier de transit",
      sub: "Maritime, Terrestre ou Aérien",
      icon: FolderPlus,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white",
    },
    {
      key: "nouveau-debours",
      label: "Enregistrer un débours",
      sub: "Avance douane ou B/L portuaire",
      icon: Wallet,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white",
    },
    {
      key: "nouvelle-facture",
      label: "Émettre une facture",
      sub: "Prestations TVA 18% + Débours 0%",
      icon: Receipt,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white",
    },
    {
      key: "nouveau-devis",
      label: "Créer un devis client",
      sub: "Cotation tarifaire & droits estimés",
      icon: FilePlus2,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white",
    },
    {
      key: "gestion-stock",
      label: "Gérer le stock & magasin",
      sub: "Entrée / sortie de marchandises MAD",
      icon: Warehouse,
      color: "text-teal-600 bg-teal-50 dark:bg-teal-950/60 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white",
    },
    {
      key: "comptabilite",
      label: "Consulter la comptabilité",
      sub: "Journaux SYSCOHADA & Grand Livre",
      icon: BookOpenCheck,
      color: "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 group-hover:bg-slate-700 group-hover:text-white",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-border/70 bg-white dark:bg-card p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
          <Zap className="size-4" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Actions rapides
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Raccourcis vers les opérations courantes
          </p>
        </div>
      </div>

      <div className="space-y-2 mt-2">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.key}
              type="button"
              onClick={() => onAction(act.key)}
              className="group flex w-full items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800/80 p-2.5 hover:border-blue-200 dark:hover:border-blue-900/60 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                    act.color
                  )}
                >
                  <Icon className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {act.label}
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {act.sub}
                  </span>
                </div>
              </div>

              <ChevronRight className="size-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

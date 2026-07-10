"use client";

import { ChevronRight } from "lucide-react";
import { useNav, type ViewKey } from "@/lib/nav-store";
import { useStore } from "@/lib/store";
import { navItems } from "@/lib/nav-items";

const DETAIL_PARENT: Partial<Record<ViewKey, ViewKey>> = {
  "dossier-detail": "dossiers",
  "dossier-form": "dossiers",
  "client-fiche": "clients",
  "devis-detail": "devis",
  "facture-detail": "factures",
};

export function BreadcrumbNav({ title, subtitle }: { title: string; subtitle?: string }) {
  const view = useNav((s) => s.view);
  const selectedId = useNav((s) => s.selectedId);
  const go = useNav((s) => s.go);

  const clients = useStore((s) => s.clients);
  const dossiers = useStore((s) => s.dossiers);
  const devis = useStore((s) => s.devis);
  const factures = useStore((s) => s.factures);

  const parentKey = DETAIL_PARENT[view];
  const parentItem = parentKey ? navItems.find((n) => n.key === parentKey) : null;

  let detailLabel = title;
  if (selectedId) {
    if (view === "client-fiche") {
      detailLabel = clients.find((c) => c.id === selectedId)?.nom ?? title;
    } else if (view === "dossier-detail" || view === "dossier-form") {
      const d = dossiers.find((x) => x.id === selectedId);
      detailLabel = d?.reference ?? (view === "dossier-form" ? "Nouveau dossier" : title);
    } else if (view === "devis-detail") {
      detailLabel = devis.find((d) => d.id === selectedId)?.reference ?? title;
    } else if (view === "facture-detail") {
      detailLabel = factures.find((f) => f.id === selectedId)?.numero ?? title;
    }
  } else if (view === "dossier-form") {
    detailLabel = "Nouveau dossier";
  }

  if (parentKey && parentItem) {
    return (
      <div className="min-w-0">
        <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={() => go(parentKey)}
            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors truncate"
          >
            {parentItem.label}
          </button>
          <ChevronRight className="mx-1.5 size-4 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
          <span className="text-slate-900 dark:text-slate-100 font-semibold truncate">{detailLabel}</span>
        </div>
        {subtitle && (
          <p className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block mt-0.5">{subtitle}</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="flex items-center text-base font-semibold leading-tight text-slate-900 dark:text-slate-100 truncate">
        {title}
      </div>
      {subtitle && (
        <p className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

"use client";

import { ChevronRight } from "lucide-react";
import { useNav, type ViewKey } from "@/lib/nav-store";
import { useAppNavigation } from "@/lib/app-navigation";
import { useStore } from "@/lib/store";
import { navItems } from "@/lib/nav-items";
import { useCanView } from "@/hooks/use-permission";

const DETAIL_PARENT: Partial<Record<ViewKey, ViewKey>> = {
  "dossier-detail": "dossiers",
  "dossier-form": "dossiers",
  "client-fiche": "clients",
  "devis-detail": "devis",
  "facture-detail": "factures",
  "contrat-detail": "contrats",
};

export function BreadcrumbNav({ title, subtitle }: { title: string; subtitle?: string }) {
  const view = useNav((s) => s.view);
  const selectedId = useNav((s) => s.selectedId);
  const { goToView } = useAppNavigation();

  const clients = useStore((s) => s.clients);
  const dossiers = useStore((s) => s.dossiers);
  const devis = useStore((s) => s.devis);
  const factures = useStore((s) => s.factures);
  const contrats = useStore((s) => s.contrats);

  const parentKey = DETAIL_PARENT[view];
  const parentItem = parentKey ? navItems.find((n) => n.key === parentKey) : null;
  // Le lien parent ne doit pas offrir une porte vers une liste que
  // l'utilisateur n'a pas le droit de consulter (ex. atteint ce détail via
  // une URL directe ou ⌘K malgré l'absence de permission de lecture).
  const canViewParent = useCanView(parentKey);

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
    } else if (view === "contrat-detail") {
      detailLabel = contrats.find((c) => c.id === selectedId)?.reference ?? title;
    }
  } else if (view === "dossier-form") {
    detailLabel = "Nouveau dossier";
  }

  if (parentKey && parentItem) {
    return (
      <div className="min-w-0">
        <div className="flex items-center text-sm font-medium text-muted-foreground">
          {canViewParent ? (
            <button
              type="button"
              onClick={() => goToView(parentKey)}
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors truncate"
            >
              {parentItem.label}
            </button>
          ) : (
            <span className="truncate">{parentItem.label}</span>
          )}
          <ChevronRight className="mx-1.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="text-foreground font-semibold truncate">{detailLabel}</span>
        </div>
        {subtitle && (
          <p className="hidden truncate text-xs text-muted-foreground sm:block mt-0.5">{subtitle}</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="flex items-center text-base font-semibold leading-tight text-foreground truncate">
        {title}
      </div>
      {subtitle && (
        <p className="hidden truncate text-xs text-muted-foreground sm:block mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

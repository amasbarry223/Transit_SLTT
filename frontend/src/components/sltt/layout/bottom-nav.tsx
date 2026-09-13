"use client";

import { useNav, type ViewKey } from "@/lib/nav-store";
import { useCanView } from "@/shared/hooks/use-permission";
import { useAppNavigation } from "@/lib/app-navigation";
import { cn } from "@/shared/utils/cn";
import {
  FolderKanban,
  LayoutDashboard,
  Menu,
  Receipt,
  Wallet,
  type LucideIcon,
} from "lucide-react";

interface BottomTab {
  id: string;
  label: string;
  icon: LucideIcon;
  view?: ViewKey;
  isMenu?: boolean;
  activeMatch: (currentView: ViewKey) => boolean;
}

const TABS: BottomTab[] = [
  {
    id: "dashboard",
    label: "Accueil",
    icon: LayoutDashboard,
    view: "dashboard",
    activeMatch: (v) => v === "dashboard",
  },
  {
    id: "dossiers",
    label: "Dossiers",
    icon: FolderKanban,
    view: "dossiers",
    activeMatch: (v) =>
      v === "dossiers" ||
      v === "dossier-form" ||
      v === "dossier-detail" ||
      v === "dossier-ocr-review",
  },
  {
    id: "factures",
    label: "Factures",
    icon: Receipt,
    view: "factures",
    activeMatch: (v) => v === "factures" || v === "facture-detail",
  },
  {
    id: "comptabilite",
    label: "Compta",
    icon: Wallet,
    view: "comptabilite",
    activeMatch: (v) => v === "comptabilite" || v === "recus-paiement" || v === "bilans",
  },
  {
    id: "menu",
    label: "Menu",
    icon: Menu,
    isMenu: true,
    activeMatch: () => false,
  },
];

export function BottomNav() {
  const currentView = useNav((s) => s.view);
  const setMobileMenuOpen = useNav((s) => s.setMobileMenuOpen);
  const { goToView } = useAppNavigation();

  const canDashboard = useCanView("dashboard");
  const canDossiers = useCanView("dossiers");
  const canFactures = useCanView("factures");
  const canCompta = useCanView("comptabilite");

  const permissionMap: Record<string, boolean> = {
    dashboard: canDashboard,
    dossiers: canDossiers,
    factures: canFactures,
    comptabilite: canCompta,
    menu: true,
  };

  const visibleTabs = TABS.filter((tab) => permissionMap[tab.id] ?? true);

  return (
    <nav
      aria-label="Navigation principale mobile"
      className={cn(
        "fixed bottom-0 inset-x-0 z-40 lg:hidden",
        "bg-card/90 backdrop-blur-xl border-t border-border/80",
        "shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.35)]",
        "pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1 px-2",
      )}
    >
      <div className="mx-auto flex h-14 max-w-lg items-center justify-around">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.activeMatch(currentView);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.isMenu) {
                  setMobileMenuOpen(true);
                } else if (tab.view) {
                  goToView(tab.view);
                }
              }}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 py-1.5 min-h-[48px] rounded-xl text-xs font-medium",
                "transition-all duration-150 active:scale-95 touch-manipulation select-none",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive && (
                <span
                  aria-hidden
                  className="absolute -top-1 size-1 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]"
                />
              )}
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg transition-colors",
                  isActive && "bg-primary/10 text-primary dark:bg-primary/20",
                )}
              >
                <Icon className={cn("size-5 shrink-0 transition-transform", isActive && "scale-110")} />
              </div>
              <span className="text-[10px] leading-tight tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

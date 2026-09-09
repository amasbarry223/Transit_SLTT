"use client";

import Image from "next/image";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useNav } from "@/lib/nav-store";
import { useAppNavigation } from "@/lib/app-navigation";
import { useVisibleNavItems } from "@/shared/hooks/use-visible-nav-items";
import { useStore } from "@/lib/store";
import { resolveAppShellBranding } from "@/lib/societe-brand";
import { useUiPrefs } from "@/lib/session/ui-prefs-store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { NavList } from "./nav-list";

export function SidebarBrand({
  logoUrl,
  alt = "Traoré de Logistique",
  size = "md",
  collapsed = false,
  onClick,
}: {
  logoUrl?: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
  collapsed?: boolean;
  onClick?: () => void;
}) {
  const effectiveLogo = logoUrl || "/logoV.png";

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center justify-center p-1 rounded-xl hover:bg-white/10 transition-colors"
        title={alt}
      >
        <div className="relative size-10 rounded-full overflow-hidden bg-white/10 p-0.5 border border-white/20">
          <Image
            src={effectiveLogo}
            alt={alt}
            fill
            className="object-contain"
            priority
          />
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center justify-center w-full px-2 py-2 text-center transition-opacity hover:opacity-95 focus:outline-none"
    >
      <div className="relative size-14 mb-2 drop-shadow-md">
        <Image
          src={effectiveLogo}
          alt={alt}
          fill
          className="object-contain"
          priority
        />
      </div>
      <div className="flex flex-col items-center tracking-tight leading-tight">
        <span className="text-[13px] font-black uppercase tracking-wider text-white">
          Traore de Logistique
        </span>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-200/90 mt-0.5">
          Transit-Transport
        </span>
      </div>
    </button>
  );
}

export function Sidebar() {
  const { view, comptaTab } = useNav();
  const { goToView } = useAppNavigation();
  const societes = useStore((s) => s.societes);
  const shellBrand = resolveAppShellBranding(societes);
  const visibleItems = useVisibleNavItems();
  const sidebarCollapsed = useUiPrefs((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiPrefs((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "hidden lg:flex shrink-0 flex-col bg-[#0B2A78] text-white border-r border-[#0B2A78]/90 h-screen sticky top-0 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-2xl z-20",
        sidebarCollapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      <div
        className={cn(
          "relative flex items-center transition-all duration-300",
          sidebarCollapsed ? "justify-center p-3" : "px-4 pt-5 pb-3"
        )}
      >
        <SidebarBrand
          logoUrl={shellBrand.logoUrl}
          alt={shellBrand.appTitle}
          size={sidebarCollapsed ? "sm" : "md"}
          collapsed={sidebarCollapsed}
          onClick={() => goToView("dashboard")}
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <NavList
          items={visibleItems}
          currentView={view}
          currentComptaTab={comptaTab}
          collapsed={sidebarCollapsed}
          onNavigate={(item) =>
            goToView(item.key, item.comptaTab ? { comptaTab: item.comptaTab } : undefined)
          }
        />
      </nav>

      {/* Bouton de réduction / agrandissement du menu */}
      <div className="border-t border-white/10 p-2">
        <TooltipProvider delayDuration={150}>
          {sidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="size-10 mx-auto flex text-blue-200 hover:bg-white/10 hover:text-white rounded-xl"
                  aria-label="Agrandir le menu"
                >
                  <PanelLeftOpen className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Agrandir le menu</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="w-full justify-start gap-2 text-xs font-medium text-blue-200/80 hover:bg-white/10 hover:text-white rounded-xl px-3"
            >
              <PanelLeftClose className="size-4 shrink-0" />
              <span>Réduire le menu</span>
            </Button>
          )}
        </TooltipProvider>
      </div>
    </aside>
  );
}

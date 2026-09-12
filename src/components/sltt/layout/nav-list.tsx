"use client";

import { Home } from "lucide-react";
import type { NavItem } from "@/lib/nav-items";
import type { ComptaTab, ViewKey } from "@/lib/nav-store";
import { cn, isNavActive } from "@/shared/utils/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

/**
 * Séparateur entre groupes métier — un simple filet, sans libellé de
 * catégorie (Cycle commercial, Finance…) : la sidebar doit tenir dans la
 * hauteur d'écran sans scroll, et ces intitulés n'apportaient qu'un
 * repère textuel redondant avec l'ordre déjà logique des icônes.
 */
function NavSectionDivider({ first }: { first?: boolean }) {
  if (first) return null;
  return <div className="my-1.5 h-px w-full bg-white/10" aria-hidden />;
}

export function NavList({
  items,
  currentView,
  currentComptaTab,
  onNavigate,
  className,
  collapsed = false,
}: {
  items: NavItem[];
  currentView: ViewKey;
  currentComptaTab?: ComptaTab;
  onNavigate: (item: NavItem) => void;
  className?: string;
  collapsed?: boolean;
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <ul className={cn("space-y-0.5", className)}>
        {items.map((item, i) => {
          const active = isNavActive(currentView, item.key, currentComptaTab, item.comptaTab);
          const isDashboard = item.key === "dashboard";
          const Icon = isDashboard ? Home : item.icon;
          const prevSection = items[i - 1]?.section;
          const showSectionDivider = item.section && item.section !== prevSection;

          const buttonNode = (
            <button
              type="button"
              onClick={() => onNavigate(item)}
              aria-label={item.label}
              className={cn(
                "group relative flex items-center overflow-hidden rounded-xl text-sm font-medium",
                "transition-all duration-150 ease-out motion-reduce:transition-none",
                collapsed
                  ? "size-10 justify-center mx-auto"
                  : "w-full gap-3 px-3.5 py-2",
                active
                  ? isDashboard
                    ? "bg-[#ED1C24] text-white shadow-md shadow-red-950/40 font-bold"
                    : "bg-[#1D4ED8] text-white shadow-md shadow-blue-950/40 font-semibold"
                  : "text-blue-100/75 hover:bg-white/[0.08] hover:text-white",
                !collapsed && !active && "hover:pl-4",
              )}
            >
              <Icon
                className={cn(
                  "size-[18px] shrink-0 transition-all duration-150 ease-out motion-reduce:transition-none",
                  active
                    ? "text-white"
                    : "text-blue-200/70 group-hover:scale-110 group-hover:text-white",
                )}
              />
              {!collapsed && (
                <span
                  className={cn(
                    "truncate transition-transform duration-150 ease-out motion-reduce:transform-none",
                    !active && "group-hover:translate-x-0.5",
                  )}
                >
                  {item.label}
                </span>
              )}
            </button>
          );

          return (
            <li key={item.navId}>
              {showSectionDivider && <NavSectionDivider first={i === 0} />}
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>{buttonNode}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10} className="font-medium text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ) : (
                buttonNode
              )}
            </li>
          );
        })}
      </ul>
    </TooltipProvider>
  );
}

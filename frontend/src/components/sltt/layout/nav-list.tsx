"use client";

import type { NavItem } from "@/lib/nav-items";
import type { ComptaTab, ViewKey } from "@/lib/nav-store";
import { cn, isNavActive } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function NavSectionLabel({ label, first, collapsed }: { label: string; first?: boolean; collapsed?: boolean }) {
  if (collapsed) {
    return <div className="my-2 h-px w-8 mx-auto bg-white/10" aria-hidden />;
  }

  return (
    <div className={cn("flex items-center gap-2 px-3 pb-1.5", first ? "pt-0" : "pt-4")}>
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-200/60">
        {label}
      </span>
      <span
        aria-hidden
        className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent"
      />
    </div>
  );
}

import { Home } from "lucide-react";

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
      <ul className={cn("space-y-1", className)}>
        {items.map((item, i) => {
          const active = isNavActive(currentView, item.key, currentComptaTab, item.comptaTab);
          const isDashboard = item.key === "dashboard";
          const Icon = isDashboard ? Home : item.icon;
          const prevSection = items[i - 1]?.section;
          const showSectionLabel = item.section && item.section !== prevSection;

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
                  : "w-full gap-3 px-3.5 py-2.5",
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
              {showSectionLabel && (
                <NavSectionLabel label={item.section!} first={i === 0} collapsed={collapsed} />
              )}
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

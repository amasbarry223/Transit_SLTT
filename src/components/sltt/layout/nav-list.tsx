"use client";

import type { NavItem } from "@/lib/nav-items";
import type { ViewKey } from "@/lib/nav-store";
import { cn, isNavActive } from "@/lib/utils";

export function NavList({
  items,
  currentView,
  onNavigate,
  className,
}: {
  items: NavItem[];
  currentView: ViewKey;
  onNavigate: (key: ViewKey) => void;
  className?: string;
}) {
  return (
    <ul className={cn("space-y-1", className)}>
      {items.map((item, i) => {
        const active = isNavActive(currentView, item.key);
        const Icon = item.icon;
        const prevSection = items[i - 1]?.section;
        const showSectionLabel = item.section && item.section !== prevSection;
        return (
          <li key={item.key}>
            {showSectionLabel && (
              <p
                className={cn(
                  "px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500",
                  i === 0 ? "pt-0" : "pt-4",
                )}
              >
                {item.section}
              </p>
            )}
            <button
              type="button"
              onClick={() => onNavigate(item.key)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
              )}
            >
              <Icon
                className={cn(
                  "size-[18px] shrink-0 transition-colors",
                  active
                    ? "text-primary"
                    : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300",
                )}
              />
              <span className="truncate">{item.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

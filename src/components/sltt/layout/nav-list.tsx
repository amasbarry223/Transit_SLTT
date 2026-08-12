"use client";

import type { NavItem } from "@/lib/nav-items";
import type { ComptaTab, ViewKey } from "@/lib/nav-store";
import { cn, isNavActive } from "@/lib/utils";

function NavSectionLabel({ label, first }: { label: string; first?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 px-3 pb-1.5", first ? "pt-0" : "pt-5")}>
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <span
        aria-hidden
        className="h-px flex-1 bg-gradient-to-r from-slate-200/90 to-transparent dark:from-slate-700/80"
      />
    </div>
  );
}

export function NavList({
  items,
  currentView,
  currentComptaTab,
  onNavigate,
  className,
}: {
  items: NavItem[];
  currentView: ViewKey;
  currentComptaTab?: ComptaTab;
  onNavigate: (item: NavItem) => void;
  className?: string;
}) {
  return (
    <ul className={cn("space-y-0.5", className)}>
      {items.map((item, i) => {
        const active = isNavActive(currentView, item.key, currentComptaTab, item.comptaTab);
        const Icon = item.icon;
        const prevSection = items[i - 1]?.section;
        const showSectionLabel = item.section && item.section !== prevSection;

        return (
          <li key={item.navId}>
            {showSectionLabel && (
              <NavSectionLabel label={item.section!} first={i === 0} />
            )}
            <button
              type="button"
              onClick={() => onNavigate(item)}
              className={cn(
                "group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium",
                "transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                active
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "text-slate-600 hover:bg-accent/60 hover:pl-[0.875rem] hover:text-slate-900 dark:text-slate-400 dark:hover:bg-accent/30 dark:hover:text-slate-100",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-1/2 w-0.5 -translate-y-1/2 rounded-full transition-all duration-200 ease-out motion-reduce:transition-none",
                  active
                    ? "h-6 bg-primary-foreground/35"
                    : "h-0 bg-primary opacity-0 group-hover:h-5 group-hover:opacity-100",
                )}
              />
              <Icon
                className={cn(
                  "size-[18px] shrink-0 transition-all duration-200 ease-out motion-reduce:transition-none",
                  active
                    ? "text-primary-foreground"
                    : "text-slate-400 group-hover:scale-110 group-hover:text-primary dark:text-slate-500 dark:group-hover:text-primary",
                )}
              />
              <span
                className={cn(
                  "truncate transition-transform duration-200 ease-out motion-reduce:transform-none",
                  !active && "group-hover:translate-x-0.5",
                )}
              >
                {item.label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

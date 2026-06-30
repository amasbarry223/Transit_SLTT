"use client";

import Image from "next/image";
import { useNav, type ViewKey } from "@/lib/nav-store";
import { navItems } from "@/lib/nav-items";
import { cn, getInitials, isNavActive } from "@/lib/utils";

export function Sidebar() {
  const view = useNav((s) => s.view);
  const go = useNav((s) => s.go);
  const currentRole = useNav((s) => s.currentRole);
  const currentUserName = useNav((s) => s.currentUserName);
  const canSeeParametres = currentRole === "Administrateur";

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(currentRole),
  );

  return (
    <aside className="hidden lg:flex w-[250px] shrink-0 flex-col border-r border-border bg-sidebar h-screen sticky top-0">
      {/* Logo */}
      <div className="flex h-16 w-full border-b border-border">
        <Image
          src="/logo.png"
          alt="SLTT"
          width={72}
          height={72}
          className="m-auto size-[52px] object-contain drop-shadow"
          unoptimized
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto sltt-scroll px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const active = isNavActive(view, item.key);
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <button
                  onClick={() => go(item.key)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-[18px] shrink-0 transition-colors",
                      active
                        ? "text-primary"
                        : "text-slate-400 group-hover:text-slate-600",
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User profile */}
      <div className="border-t border-border p-3">
        <button
          className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => canSeeParametres && go("parametres")}
          title={canSeeParametres ? "Accéder aux paramètres" : undefined}
          aria-label={`Connecté en tant que ${currentUserName} — ${currentRole}`}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-sm font-semibold text-white">
            {getInitials(currentUserName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {currentUserName.split(" ").map((w, i) => i === 0 ? w : w[0] + ".").join(" ")}
            </p>
            <p className="truncate text-xs text-slate-500">{currentRole}</p>
          </div>
        </button>
      </div>
    </aside>
  );
}

/** Nav horizontale scrollable pour mobile (< lg) */
export function MobileNav() {
  const view = useNav((s) => s.view);
  const go = useNav((s) => s.go);
  const currentRole = useNav((s) => s.currentRole);

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(currentRole),
  );

  return (
    <div className="lg:hidden border-b border-border bg-sidebar overflow-x-auto sltt-scroll">
      <div className="flex items-center gap-1 px-3 py-2 min-w-max">
        <div className="flex items-center pr-3 mr-1 border-r border-border">
          <div className="flex items-center justify-center size-9 rounded-lg bg-white p-0.5 shadow-sm ring-1 ring-blue-100/60">
            <Image
              src="/logo.png"
              alt="SLTT"
              width={36}
              height={36}
              className="h-full w-full object-contain"
              unoptimized
            />
          </div>
        </div>
        {visibleItems.map((item) => {
          const active = isNavActive(view, item.key);
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => go(item.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

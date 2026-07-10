"use client";

import Image from "next/image";
import { useNav } from "@/lib/nav-store";
import { usePermission } from "@/hooks/use-permission";
import { useVisibleNavItems } from "@/hooks/use-visible-nav-items";
import { cn, getInitials } from "@/lib/utils";
import { NavList } from "./nav-list";

export function Sidebar() {
  const view = useNav((s) => s.view);
  const go = useNav((s) => s.go);
  const currentUserName = useNav((s) => s.currentUserName);
  const currentRole = useNav((s) => s.currentRole);
  const canSeeParametres = usePermission("parametres:read");
  const visibleItems = useVisibleNavItems();

  return (
    <aside className="hidden lg:flex w-[250px] shrink-0 flex-col border-r border-border bg-sidebar h-screen sticky top-0">
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

      <nav className="flex-1 overflow-y-auto sltt-scroll px-3 py-4">
        <NavList items={visibleItems} currentView={view} onNavigate={go} />
      </nav>

      <div className="border-t border-border p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => canSeeParametres && go("parametres")}
          title={canSeeParametres ? "Accéder aux paramètres" : undefined}
          aria-label={`Connecté en tant que ${currentUserName} — ${currentRole}`}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-sm font-semibold text-white">
            {getInitials(currentUserName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {currentUserName.split(" ").map((w, i) => (i === 0 ? w : w[0] + ".")).join(" ")}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{currentRole}</p>
          </div>
        </button>
      </div>
    </aside>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { useNav, type ViewKey } from "@/lib/nav-store";
import {
  LayoutDashboard,
  FolderKanban,
  Wallet,
  Warehouse,
  FileOutput,
  Users,
  BarChart3,
  Settings,
  Truck,
} from "lucide-react";

interface NavItem {
  key: ViewKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { key: "dossiers", label: "Dossiers de transit", icon: FolderKanban },
  { key: "comptabilite", label: "Comptabilité", icon: Wallet },
  { key: "entreposage", label: "Entreposage", icon: Warehouse },
  { key: "bons", label: "Bons de sortie", icon: FileOutput },
  { key: "clients", label: "Clients", icon: Users },
  { key: "bilans", label: "Bilans & rapports", icon: BarChart3 },
  { key: "parametres", label: "Paramètres", icon: Settings },
];

export function Sidebar() {
  const view = useNav((s) => s.view);
  const go = useNav((s) => s.go);

  const isActive = (key: ViewKey) => {
    if (
      key === "dossiers" &&
      (view === "dossier-form" || view === "dossier-detail")
    ) {
      return true;
    }
    if (key === "clients" && view === "client-fiche") return true;
    return view === key;
  };

  return (
    <aside className="hidden lg:flex w-[250px] shrink-0 flex-col border-r border-border bg-sidebar h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Truck className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 leading-none tracking-tight">
            SLTT
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500 leading-none truncate">
            Logistique · Transit
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto sltt-scroll px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Menu principal
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.key);
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
                  {active && (
                    <span className="ml-auto size-1.5 rounded-full bg-primary" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User profile */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white text-sm font-semibold shrink-0">
            AT
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">
              Amadou T.
            </p>
            <p className="text-xs text-slate-500 truncate">Administrateur</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/** Compact top navigation for mobile (below lg breakpoint) */
export function MobileNav() {
  const view = useNav((s) => s.view);
  const go = useNav((s) => s.go);

  const isActive = (key: ViewKey) => {
    if (
      key === "dossiers" &&
      (view === "dossier-form" || view === "dossier-detail")
    ) {
      return true;
    }
    if (key === "clients" && view === "client-fiche") return true;
    return view === key;
  };

  return (
    <div className="lg:hidden border-b border-border bg-sidebar overflow-x-auto sltt-scroll">
      <div className="flex items-center gap-1 px-3 py-2 min-w-max">
        <div className="flex items-center gap-2 pr-3 mr-1 border-r border-border">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Truck className="size-4" />
          </div>
          <span className="font-bold text-slate-900">SLTT</span>
        </div>
        {navItems.map((item) => {
          const active = isActive(item.key);
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
